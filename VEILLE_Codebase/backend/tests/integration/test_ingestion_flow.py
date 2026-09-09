import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from io import BytesIO

def test_upload_evidence_success(client, mock_db_session):
    """Test full FIR ingestion upload flow."""
    from api.auth import create_access_token
    from db.models import Case, User
    import uuid
    
    # 1. Setup mock user and token
    token = create_access_token("user_inv", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="user_inv", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    
    # 2. Setup mock case that belongs to the investigator
    mock_case = Case(id="case_123", investigators=[mock_user])
    
    # 3. Configure mock DB to return user then case
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user, # For get_current_user
        mock_case  # For upload_evidence
    ]
    
    # Create a dummy PDF file
    file_content = b"Dummy PDF content"
    file = ("dummy.pdf", BytesIO(file_content), "application/pdf")
    
    with patch("api.routers.ingestion.extract_entities_task") as mock_task:
        mock_task_result = MagicMock()
        mock_task_result.id = "mock_job_id"
        mock_task.delay.return_value = mock_task_result
        
        response = client.post(
            "/api/v1/evidence/upload",
            headers={"Authorization": f"Bearer {token}"},
            data={"case_id": "case_123", "source_type": "FIR"},
            files={"file": file}
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        data = response.json()
        assert data["status"] == "processing"
        assert data["job_id"] == "mock_job_id"
        assert "evidence_id" in data
        
        # Verify db add and commit were called for the Evidence record and AuditLog
        assert mock_db_session.add.call_count == 2
        mock_db_session.commit.assert_called()
        
        # Verify the celery task was dispatched
        mock_task.delay.assert_called_once()
        args, kwargs = mock_task.delay.call_args
        assert args[0] == data["evidence_id"]  # evidence_id
        assert args[2] == "case_123"           # case_id


def test_upload_evidence_unauthorized_case(client, mock_db_session):
    """Test upload fails when investigator tries to upload to someone else's case."""
    from api.auth import create_access_token
    from db.models import Case, User
    
    token = create_access_token("user_inv", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="user_inv", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    other_user = User(id="other_investigator", email="other@example.com", role="INVESTIGATOR", is_active=True)
    
    # Case belongs to a DIFFERENT investigator
    mock_case = Case(id="case_123", investigators=[other_user])
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user, 
        mock_case  
    ]
    
    file_content = b"Dummy PDF content"
    file = ("dummy.pdf", BytesIO(file_content), "application/pdf")
    
    response = client.post(
        "/api/v1/evidence/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"case_id": "case_123", "source_type": "FIR"},
        files={"file": file}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "another investigator's case" in response.json().get("detail", "").lower()

def test_upload_evidence_invalid_type(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("user_inv", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="user_inv", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    
    file = ("dummy.pdf", BytesIO(b"dummy"), "application/pdf")
    response = client.post(
        "/api/v1/evidence/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"case_id": "case_123", "source_type": "INVALID"},
        files={"file": file}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_upload_evidence_invalid_extension(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("user_inv", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="user_inv", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    
    file = ("dummy.exe", BytesIO(b"dummy"), "application/x-msdownload")
    response = client.post(
        "/api/v1/evidence/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"case_id": "case_123", "source_type": "FIR"},
        files={"file": file}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_upload_evidence_case_not_found(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("user_inv", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="user_inv", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user,
        None
    ]
    
    file = ("dummy.pdf", BytesIO(b"dummy"), "application/pdf")
    response = client.post(
        "/api/v1/evidence/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"case_id": "case_123", "source_type": "FIR"},
        files={"file": file}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_evidence_for_case(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case, Evidence
    from datetime import datetime
    
    token = create_access_token("sup_1", "sup@example.com", "HEAD")
    mock_user = User(id="sup_1", email="sup@example.com", role="HEAD", is_active=True)
    mock_case = Case(id="case_123", investigators=[mock_user])
    mock_ev = Evidence(
        id="ev_1", case_id="case_123", source_type="FIR", 
        original_filename="dummy.pdf", status="COMPLETED", created_at=datetime.utcnow()
    )
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user,
        mock_case
    ]
    mock_db_session.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_ev]
    
    response = client.get("/api/v1/evidence/case_123", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

def test_get_evidence_status(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Evidence
    from datetime import datetime
    
    token = create_access_token("sup_1", "sup@example.com", "HEAD")
    mock_user = User(id="sup_1", email="sup@example.com", role="HEAD", is_active=True)
    mock_ev = Evidence(
        id="ev_1", case_id="case_123", source_type="FIR", 
        status="COMPLETED", updated_at=datetime.utcnow()
    )
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user,
        mock_ev
    ]
    
    response = client.get("/api/v1/evidence/status/ev_1", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "COMPLETED"
