# 11 SECURITY SPECIFICATION

**Status:** IMPLEMENTATION READY — Phase 1, Week 1
**Component:** Application Engine — Authentication & Authorization
**Phase:** 1 (Backend Unblocking)

This specification defines the complete JWT authentication system, RBAC enforcement contract, and session management behavior for VEILLE v4.0. It replaces the previous stub and the mocked `require_role()` decorator.

---

## 1. Current Problem

The current `require_role()` decorator in `backend/auth/` **exists but does not validate tokens**. It accepts any request regardless of the `Authorization` header. This means:

- Any user (authenticated or not) can access any investigator's cases
- The audit log cannot attribute actions to a real user identity
- The frontend logs users out on page refresh (no token persistence)

---

## 2. JWT Authentication Specification

### 2.1 Token Structure

VEILLE uses **HS256 signed JWT tokens**. Every token payload must contain:

```json
{
  "sub": "user-uuid-from-postgres",
  "email": "investigator@VEILLE.gov.in",
  "role": "INVESTIGATOR",
  "exp": 1735689600,
  "iat": 1735603200,
  "jti": "unique-token-id-for-revocation"
}
```

**Token lifetimes:**
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days (stored in `httpOnly` cookie to prevent XSS)

### 2.2 Login Endpoint Contract

```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "email": "investigator@VEILLE.gov.in",
  "password": "plaintext-password"
}

Response 200:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "investigator@VEILLE.gov.in",
    "role": "INVESTIGATOR"
  }
}

Response 401:
{
  "detail": "Invalid credentials"
}
```

**Backend logic:**
1. Query `USERS` table by `email`
2. Verify password using `bcrypt.checkpw()` (passwords stored as bcrypt hash, never plaintext)
3. Generate access token signed with `JWT_SECRET` from `.env`
4. Set refresh token in `httpOnly` cookie (`Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict`)
5. Write to `AUDIT_LOGS`: `action_type=LOGIN, actor_id=user.id`

### 2.3 Token Refresh Endpoint

```
POST /api/v1/auth/refresh

Request: (no body — reads httpOnly cookie automatically)

Response 200:
{
  "access_token": "eyJ...",
  "expires_in": 900
}

Response 401:
{
  "detail": "Refresh token expired or invalid. Please log in again."
}
```

This endpoint **fixes the page-refresh logout bug**. The frontend should call this on every app load before rendering protected routes.

---

## 3. RBAC Enforcement — `require_role()` Middleware

### 3.1 Implementation Contract

```python
# backend/auth/middleware.py

from functools import wraps
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Validates the JWT token and returns the decoded payload.
    Raises HTTP 401 if token is missing, expired, or tampered.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*allowed_roles: str):
    """
    FastAPI dependency that enforces RBAC.
    Usage: @router.get("/admin", dependencies=[Depends(require_role("ADMIN", "SUPERVISOR"))])
    """
    def dependency(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return dependency
```

### 3.2 RBAC Permission Matrix

| Endpoint | INVESTIGATOR | SUPERVISOR | AUDITOR | ADMIN |
|---|---|---|---|---|
| `GET /api/cases` (own cases only) | ✅ | ✅ | ✅ (read-only) | ✅ |
| `POST /api/cases` | ✅ | ✅ | ❌ | ✅ |
| `DELETE /api/cases/{id}` | ❌ | ✅ | ❌ | ✅ |
| `GET /api/graph/{case_id}` | ✅ (own cases) | ✅ | ✅ | ✅ |
| `POST /api/evidence/upload` | ✅ | ✅ | ❌ | ✅ |
| `GET /api/audit-logs` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/admin/users` | ❌ | ❌ | ❌ | ✅ |
| `GET /api/review-queue` | ✅ | ✅ | ❌ | ✅ |
| `POST /api/review-queue/merge` | ✅ | ✅ | ❌ | ✅ |

### 3.3 Case Isolation Enforcement

An `INVESTIGATOR` must **only** see cases where they are the `primary_investigator_id`. This is enforced at the **service layer**, not at the route layer:

```python
# backend/services/case_service.py

def get_cases_for_user(user_id: str, db: Session) -> list[Case]:
    """
    CRITICAL: Always filter by primary_investigator_id.
    Never return all cases to a non-ADMIN/SUPERVISOR role.
    """
    return db.query(Case).filter(Case.primary_investigator_id == user_id).all()
```

---

## 4. Password Management

- All passwords stored as **bcrypt hashes** (cost factor 12)
- No plaintext passwords ever stored or logged
- Password reset flow: email-based one-time token (out of scope for MVP; use admin reset)
- Default admin credentials set via `.env` on first run, forced change on first login

---

## 5. Audit Trail Integration

Every authenticated action must write to `AUDIT_LOGS`:

```python
# This must be called in every route that modifies data
def log_action(db: Session, actor_id: str, action_type: str, case_id: str, metadata: dict = {}):
    entry = AuditLog(
        actor_id=actor_id,
        action_type=action_type,
        target_case_id=case_id,
        metadata=json.dumps(metadata)
    )
    db.add(entry)
    db.commit()
```

**Required action types to log:**
- `LOGIN`, `LOGOUT`
- `CREATE_CASE`, `UPDATE_CASE`, `CLOSE_CASE`
- `UPLOAD_EVIDENCE`, `VIEW_EVIDENCE`
- `QUERY_GRAPH`, `EXPORT_GRAPH`
- `MERGE_ENTITY`, `REJECT_MERGE`
- `ACCESS_DENIED` (log failed RBAC checks for security monitoring)

---

## 6. Security Checklist (Definition of Done)

- [ ] `POST /api/v1/auth/login` returns a signed JWT
- [ ] `require_role()` validates token signature and expiry — returns 401 on failure
- [ ] Page refresh does not log user out (refresh token in httpOnly cookie)
- [ ] INVESTIGATOR cannot access another investigator's case (returns 403)
- [ ] All write operations create an `AUDIT_LOGS` entry
- [ ] Passwords are stored as bcrypt hashes (verify: check `USERS` table, no plaintext)
- [ ] Integration test: unauthorized request to `/api/graph/{id}` returns 401
