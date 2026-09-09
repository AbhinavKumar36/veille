import pytest
from fastapi import status

def test_unauthorized_request(client):
    """Test that accessing a protected route without a token returns 401."""
    response = client.get("/api/v1/cases/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "not authenticated" in response.json().get("detail", "").lower()

def test_wrong_role_forbidden(client, mock_db_session):
    """Test that a user with the wrong role gets a 403 Forbidden."""
    from api.auth import create_access_token
    from db.models import User
    
    # Create token for INVESTIGATOR
    token = create_access_token("user_investigator", "inv@example.com", "INVESTIGATOR")
    
    # Mock the DB to return the active user during get_current_user
    mock_user = User(id="user_investigator", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    
    # DELETE case requires SUPERVISOR or ADMIN
    response = client.delete(
        "/api/v1/cases/case_1",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "access denied" in response.json().get("detail", "").lower()

def test_correct_role_authorized(client, mock_db_session):
    """Test that a user with the correct role can access the route."""
    from api.auth import create_access_token
    from db.models import User
    
    # Create token for ADMIN
    token = create_access_token("user_admin", "admin@example.com", "ADMIN")
    
    # Mock the DB to return the active user
    mock_user = User(id="user_admin", email="admin@example.com", role="ADMIN", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    
    # DELETE case requires ADMIN
    # We expect a 404 since the case_1 might not exist, but NOT a 401 or 403
    response = client.delete(
        "/api/v1/cases/case_1",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code != status.HTTP_403_FORBIDDEN
    assert response.status_code != status.HTTP_401_UNAUTHORIZED
