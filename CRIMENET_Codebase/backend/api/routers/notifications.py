"""
VEILLE — Notifications Router
Allows users to fetch their notifications and mark them as read.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from api.auth import get_current_user
from core.database import get_db
from db.models import Notification

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[NotificationResponse])
@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch notifications for the current user."""
    notifications = db.query(Notification).filter(Notification.user_id == current_user["id"]).order_by(Notification.created_at.desc()).all()
    
    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            message=n.message,
            type=n.type,
            is_read=n.is_read,
            created_at=n.created_at.isoformat()
        )
        for n in notifications
    ]

@router.patch("/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(Notification.user_id == current_user["id"], Notification.is_read == False).update({"is_read": True})
    db.commit()
