import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from api.auth import get_password_hash, create_refresh_token, create_access_token

def test_login_success_and_failures(client, mock_db_session):
    from db.models import User

    hashed = get_password_hash("secret123")
    user = User(id="user_123", email="agent@veille.gov.in", hashed_password=hashed, role="INVESTIGATOR", is_active=True)

    # 1. Successful login
    mock_db_session.query.return_value.filter.return_value.first.return_value = user
    with patch("redis.Redis.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_redis.return_value = mock_r
        mock_r.get.return_value = "0"

        res = client.post("/api/v1/auth/login", json={"email": "agent@veille.gov.in", "password": "secret123"})
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "agent@veille.gov.in"
        assert "refresh_token" in res.cookies

    # 2. Failed login (bad password)
    mock_db_session.query.return_value.filter.return_value.first.return_value = user
    with patch("redis.Redis.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_redis.return_value = mock_r
        mock_r.get.return_value = "0"

        res = client.post("/api/v1/auth/login", json={"email": "agent@veille.gov.in", "password": "wrongpassword"})
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    # 3. User not found
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    with patch("redis.Redis.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_redis.return_value = mock_r
        mock_r.get.return_value = "0"

        res = client.post("/api/v1/auth/login", json={"email": "nobody@veille.gov.in", "password": "secret123"})
        assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_token_flow(client, mock_db_session):
    refresh_token = create_refresh_token("user_123")

    # 1. Missing cookie
    res = client.post("/api/v1/auth/refresh")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

    # 2. Valid refresh
    with patch("redis.Redis.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_redis.return_value = mock_r
        mock_r.exists.return_value = False

        client.cookies.set("refresh_token", refresh_token)
        res = client.post("/api/v1/auth/refresh")
        assert res.status_code == status.HTTP_200_OK
        assert "access_token" in res.json()

    # 3. Invalid token type (access token passed instead)
    access_token = create_access_token("user_123", "agent@veille.gov.in", "INVESTIGATOR")
    client.cookies.set("refresh_token", access_token)
    res = client.post("/api/v1/auth/refresh")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_logout_and_me(client, mock_db_session):
    from db.models import User

    token = create_access_token("user_123", "agent@veille.gov.in", "INVESTIGATOR")
    mock_user = User(id="user_123", email="agent@veille.gov.in", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    # 1. /me endpoint
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["email"] == "agent@veille.gov.in"

    # 2. /logout endpoint
    res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_204_NO_CONTENT
