"""
VEILLE v4.0 — Authentication & Authorization
Implements real JWT token generation, validation, refresh token flow,
and RBAC enforcement. Replaces the mocked require_role() stub.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from db.models import User, AuditLog
import bcrypt

# ── OAuth2 scheme (reads Bearer token from Authorization header) ───────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# ── Password Utilities ──────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a plaintext password with bcrypt (cost factor 12)."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


# ── Token Generation ────────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str, role: str) -> str:
    """
    Generate a signed HS256 JWT access token.
    Expires in JWT_ACCESS_TOKEN_EXPIRE_MINUTES (default: 15 min).
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),   # Unique token ID (enables future revocation)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Generate a signed HS256 JWT refresh token.
    Expires in JWT_REFRESH_TOKEN_EXPIRE_DAYS (default: 7 days).
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """
    Store refresh token in an httpOnly cookie to prevent XSS access.
    This fixes the page-refresh logout bug.
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,           # JS cannot read this cookie — prevents XSS
        secure=settings.APP_ENV != "development",  # HTTPS-only in production
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",     # Only sent to auth endpoints
    )


# ── Token Validation ────────────────────────────────────────────────────────

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token without raising HTTPException.
    Returns payload dictionary or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except Exception:
        return None


def _decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token. Raises HTTP 401 on any failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )



async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> dict:
    """
    FastAPI dependency: validates the Bearer token and returns the
    decoded user payload. Raises HTTP 401 if token is missing or invalid.

    Usage:
        @router.get("/protected")
        def route(current_user: dict = Depends(get_current_user)):
            ...
    """
    payload = _decode_token(token)

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user identity.")

    # Verify user still exists and is active in the database
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
        )

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
    }


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory for RBAC enforcement.
    ADMIN / HEAD always has access regardless of which roles are specified.

    Usage:
        @router.delete("/cases/{id}",
                       dependencies=[Depends(require_role("SUPERVISOR", "ADMIN"))])
        def delete_case(...):
            ...

        # Or to get the current user in the handler:
        @router.get("/cases")
        def get_cases(current_user: dict = Depends(require_role("INVESTIGATOR"))):
            ...
    """
    async def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        user_role = current_user.get("role", "")
        if user_role not in allowed_roles and user_role not in ("ADMIN", "HEAD", "HEAD_OPERATOR"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}.",
            )
        return current_user

    return role_checker



# ── Audit Logging Helper ────────────────────────────────────────────────────

def log_action(
    db: Session,
    actor_id: str,
    action_type: str,
    case_id: Optional[str] = None,
    extra_metadata: Optional[str] = None,
) -> None:
    """
    Write an immutable audit log entry. Call this in every route
    that reads or modifies sensitive data.

    Action types: LOGIN, LOGOUT, CREATE_CASE, UPDATE_CASE, CLOSE_CASE,
                  UPLOAD_EVIDENCE, VIEW_EVIDENCE, QUERY_GRAPH, EXPORT_GRAPH,
                  MERGE_ENTITY, REJECT_MERGE, ACCESS_DENIED
    """
    try:
        entry = AuditLog(
            actor_id=actor_id,
            action_type=action_type,
            target_case_id=case_id,
            extra_metadata=extra_metadata,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        # Audit log failure must never crash the main request
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"Failed to write audit log: {e}")
