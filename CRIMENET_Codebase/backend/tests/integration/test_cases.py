import pytest
from fastapi import status
from unittest.mock import patch, MagicMock
from datetime import datetime

def test_get_cases_supervisor(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case
    
    token = create_access_token("sup_1", "sup@example.com", "HEAD")
    mock_user = User(id="sup_1", email="sup@example.com", role="HEAD", is_active=True)
    
    mock_case = Case(
        id="case_1", 
        title="Test Case", 
        status="OPEN",
        priority="HIGH",
        created_at=datetime.utcnow(),
        investigators=[mock_user]
    )
    
    mock_db_session.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_case]
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    
    response = client.get("/api/v1/cases/", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

def test_get_case_unauthorized_investigator(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case
    
    token = create_access_token("inv_1", "inv1@example.com", "INVESTIGATOR")
    mock_user = User(id="inv_1", email="inv1@example.com", role="INVESTIGATOR", is_active=True)
    other_user = User(id="inv_2", email="inv2@example.com", role="INVESTIGATOR", is_active=True)
    
    mock_case = Case(
        id="case_1", 
        title="Test Case", 
        created_at=datetime.utcnow(),
        investigators=[other_user]
    )
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user,
        mock_case
    ]
    
    response = client.get("/api/v1/cases/case_1", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_create_case(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("inv_1", "inv1@example.com", "INVESTIGATOR")
    mock_user = User(id="inv_1", email="inv1@example.com", role="INVESTIGATOR", is_active=True)
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    
    def mock_refresh(obj):
        obj.id = "new_case_1"
        obj.created_at = datetime.utcnow()
        obj.status = "OPEN"
        obj.investigators = [mock_user]
        
    mock_db_session.refresh.side_effect = mock_refresh
    
    response = client.post(
        "/api/v1/cases/", 
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "New Case", "priority": "HIGH"}
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["title"] == "New Case"

def test_close_case(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case
    
    token = create_access_token("sup_1", "sup@example.com", "HEAD")
    mock_user = User(id="sup_1", email="sup@example.com", role="HEAD", is_active=True)
    
    mock_case = Case(id="case_1", title="Test Case", status="OPEN")
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user,
        mock_case,
        mock_user # for log_action
    ]
    
    response = client.patch("/api/v1/cases/case_1/close", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == status.HTTP_200_OK
    assert mock_case.status == "CLOSED"

def test_delete_case(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case
    
    token = create_access_token("admin_1", "admin@example.com", "HEAD")
    mock_user = User(id="admin_1", email="admin@example.com", role="HEAD", is_active=True)
    
    mock_case = Case(id="case_1", title="Test Case")
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user,
        mock_case,
        mock_user # for log_action
    ]
    
    response = client.delete("/api/v1/cases/case_1", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == status.HTTP_200_OK
