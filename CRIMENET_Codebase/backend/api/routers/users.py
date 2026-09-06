"""
VEILLE — Users Router
Allows users with HEAD role to create, list, and delete investigators.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import uuid

from api.auth import get_current_user, require_role, log_action, get_password_hash
from core.database import get_db
from db.models import User

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "INVESTIGATOR"  # Can be HEAD or INVESTIGATOR


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


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
        is_active=new_user.is_active,
    )


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
