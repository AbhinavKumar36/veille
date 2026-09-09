import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, status
from jose import jwt

from api.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    _decode_token,
    get_current_user,
    require_role,
    log_action,
)
from core.config import settings
from db.models import User, AuditLog


def test_password_hashing():
    pwd = "secret_password"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_create_access_token():
    token = create_access_token("user_123", "test@example.com", "ADMIN")
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    
    assert payload["sub"] == "user_123"
    assert payload["email"] == "test@example.com"
    assert payload["role"] == "ADMIN"
    assert "exp" in payload
    assert "jti" in payload


def test_create_refresh_token():
    token = create_refresh_token("user_123")
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    
    assert payload["sub"] == "user_123"
    assert payload["type"] == "refresh"
    assert "exp" in payload
    assert "jti" in payload


def test_decode_token_valid():
    token = create_access_token("user_123", "test@example.com", "ADMIN")
    payload = _decode_token(token)
    assert payload["sub"] == "user_123"


def test_decode_token_expired():
    # Create an expired token manually
    expire = datetime.now(timezone.utc) - timedelta(minutes=1)
    payload = {"sub": "user_123", "exp": expire}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    with pytest.raises(HTTPException) as excinfo:
        _decode_token(token)
    assert excinfo.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "expired" in excinfo.value.detail.lower()


def test_decode_token_invalid():
    with pytest.raises(HTTPException) as excinfo:
        _decode_token("invalid.token.string")
    assert excinfo.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid" in excinfo.value.detail.lower()


@pytest.mark.asyncio
async def test_get_current_user_valid():
    token = create_access_token("user_123", "test@example.com", "ADMIN")
    
    mock_db = MagicMock()
    mock_user = User(id="user_123", email="test@example.com", role="ADMIN", is_active=True)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    
    user_dict = await get_current_user(token=token, db=mock_db)
    
    assert user_dict["id"] == "user_123"
    assert user_dict["email"] == "test@example.com"
    assert user_dict["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_get_current_user_not_found():
    token = create_access_token("user_123", "test@example.com", "ADMIN")
    
    mock_db = MagicMock()
    # User not found
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(token=token, db=mock_db)
        
    assert excinfo.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "not found" in excinfo.value.detail.lower()


@pytest.mark.asyncio
async def test_require_role_authorized():
    role_checker = require_role("INVESTIGATOR")
    # ADMIN is always authorized
    user_admin = {"role": "ADMIN"}
    assert await role_checker(current_user=user_admin) == user_admin
    
    user_investigator = {"role": "INVESTIGATOR"}
    assert await role_checker(current_user=user_investigator) == user_investigator


@pytest.mark.asyncio
async def test_require_role_forbidden():
    role_checker = require_role("SUPERVISOR")
    user_investigator = {"role": "INVESTIGATOR"}
    
    with pytest.raises(HTTPException) as excinfo:
        await role_checker(current_user=user_investigator)
        
    assert excinfo.value.status_code == status.HTTP_403_FORBIDDEN
    assert "access denied" in excinfo.value.detail.lower()


def test_log_action_success():
    mock_db = MagicMock()
    
    log_action(mock_db, actor_id="user_1", action_type="LOGIN", case_id="case_1")
    
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


def test_log_action_failure():
    mock_db = MagicMock()
    mock_db.commit.side_effect = Exception("DB error")
    
    # Should not raise exception
    log_action(mock_db, actor_id="user_1", action_type="LOGIN", case_id="case_1")
    
    mock_db.rollback.assert_called_once()
