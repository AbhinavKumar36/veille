"""
VEILLE v4.0 — Authentication Router
POST /api/v1/auth/login   — issue JWT access token + refresh cookie
POST /api/v1/auth/refresh — exchange refresh cookie for new access token
POST /api/v1/auth/logout  — clear refresh cookie + write audit log
GET  /api/v1/auth/me      — return current user profile
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import redis

from api.auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    log_action,
    set_refresh_cookie,
    verify_password,
    _decode_token,
)
from core.config import settings
from core.database import get_db
from db.models import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# ── Request / Response Schemas ──────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: dict


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticate an investigator with email + password.
    Returns a short-lived JWT access token and sets a long-lived
    refresh token in an httpOnly cookie (fixes page-refresh logout).
    """
    # 0. Rate limit check (5 attempts per minute per IP)
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:login:{client_ip}"
        attempts = r.get(key)
        if attempts and int(attempts) >= 5:
            raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
        r.incr(key)
        if not attempts:
            r.expire(key, 60)
    except redis.RedisError:
        pass  # fail open if redis is unavailable

    # 1. Look up user by email
    user = db.query(User).filter(
        User.email == body.email,
        User.is_active == True,
    ).first()

    # 2. Verify password (constant-time comparison via bcrypt)
    if not user or not verify_password(body.password, user.hashed_password):
        # Log failed attempt for security monitoring
        if user:
            log_action(db, str(user.id), "ACCESS_DENIED")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 3. Generate tokens
    access_token = create_access_token(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
    )
    refresh_token = create_refresh_token(user_id=str(user.id))

    # 4. Set refresh token in httpOnly cookie (survives page refresh)
    set_refresh_cookie(response, refresh_token)

    # 5. Write audit log
    log_action(db, str(user.id), "LOGIN")

    return LoginResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
        },
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_access_token(request: Request, response: Response):
    """
    Exchange a valid refresh token (from httpOnly cookie) for a new access token.
    Frontend calls this on every page load to restore the session silently.
    This is what fixes the page-refresh logout bug.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token. Please log in again.",
        )

    payload = _decode_token(refresh_token)

    # Verify it's actually a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Malformed refresh token.")

    # Issue a fresh access token (reuse the same refresh token until it expires)
    # Refresh token rotation: Blacklist old token and issue a new one
    jti = payload.get("jti")
    if jti:
        try:
            r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            if r.exists(f"blacklist:{jti}"):
                raise HTTPException(status_code=401, detail="Refresh token has been revoked.")
            r.setex(f"blacklist:{jti}", settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400, "1")
        except redis.RedisError:
            pass

    access_token = create_access_token(
        user_id=user_id,
        email=payload.get("email", ""),
        role=payload.get("role", "INVESTIGATOR"),
    )

    new_refresh_token = create_refresh_token(user_id=user_id)
    set_refresh_cookie(response, new_refresh_token)

    return RefreshResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear the refresh token cookie and write an audit log entry.
    """
    log_action(db, current_user["id"], "LOGOUT")

    # Clear the refresh cookie by setting max_age=0
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's profile.
    Useful for the frontend to hydrate the user context on load.
    """
    return current_user
