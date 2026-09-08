"""
VEILLE — Users Router
Allows users with HEAD role to create, list, and delete investigators.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from api.auth import get_current_user, require_role, log_action, get_password_hash
from core.database import get_db
from db.models import User

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "INVESTIGATOR"  # Can be HEAD or INVESTIGATOR
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    current_user: dict = Depends(require_role("HEAD")),
    db: Session = Depends(get_db),
):
    """Create a new user. Only HEAD can do this."""
    existing_user = db.query(User).filter(User.email == body.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    if body.role not in ["HEAD", "INVESTIGATOR"]:
        raise HTTPException(status_code=400, detail="Role must be HEAD or INVESTIGATOR.")

    hashed_password = get_password_hash(body.password)
    
    new_user = User(
        email=body.email,
        hashed_password=hashed_password,
        role=body.role,
        full_name=body.full_name,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, current_user["id"], "CREATE_USER", extra_metadata=f"Created user {new_user.email}")

    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        role=new_user.role,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
    )


@router.get("", response_model=list[UserResponse])
@router.get("/", response_model=list[UserResponse])
def get_users(
    current_user: dict = Depends(require_role("HEAD")),
    db: Session = Depends(get_db),
):
    """List all users. Only HEAD can view this."""
    users = db.query(User).all()
    log_action(db, current_user["id"], "LIST_USERS")
    return [
        UserResponse(
            id=str(u.id),
            email=u.email,
            role=u.role,
            full_name=u.full_name,
            is_active=u.is_active,
        )
        for u in users
    ]


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role("HEAD")),
    db: Session = Depends(get_db),
):
    """Delete a user. Only HEAD can do this."""
    if str(current_user["id"]) == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()

    log_action(db, current_user["id"], "DELETE_USER", extra_metadata=f"Deleted user {user.email}")


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: dict = Depends(require_role("HEAD")),
    db: Session = Depends(get_db),
):
    """Modify an existing user. Only HEAD can do this."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if body.email is not None:
        user.email = body.email
    if body.role is not None:
        if body.role not in ["HEAD", "INVESTIGATOR"]:
            raise HTTPException(status_code=400, detail="Role must be HEAD or INVESTIGATOR.")
        user.role = body.role
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.password is not None:
        user.hashed_password = get_password_hash(body.password)

    db.commit()
    db.refresh(user)

    log_action(db, current_user["id"], "UPDATE_USER", extra_metadata=f"Updated user {user.email}")

    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        is_active=user.is_active,
    )


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password."""
    from api.auth import verify_password

    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not verify_password(body.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password.")

    user.hashed_password = get_password_hash(body.new_password)
    db.commit()

    log_action(db, current_user["id"], "CHANGE_PASSWORD")
