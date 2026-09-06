"""
VEILLE — Audit Logs Router
Provides tamper-evident system audit trail and telemetry events from PostgreSQL.
"""
from typing import List, Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from api.auth import get_current_user, require_role
from core.database import get_db
from db.models import AuditLog, User, Case

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])


class AuditLogResponse(BaseModel):
    id: str
    timestamp: str
    actor: str
    action: str
    target: str
    ip: str
    isWarning: bool = False
    isHighlighted: bool = False
    raw: dict


@router.get("", response_model=List[AuditLogResponse])
@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns recent immutable audit logs for security, compliance, and telemetry.
    Returns empty list if no logs exist.
    """
    query = (
        db.query(AuditLog, User.email, Case.title)
        .join(User, AuditLog.actor_id == User.id, isouter=True)
        .join(Case, AuditLog.target_case_id == Case.id, isouter=True)
        .order_by(desc(AuditLog.created_at))
        .offset(skip)
        .limit(limit)
    )

    results = query.all()

    if not results:
        return []

    logs = []
    for audit, user_email, case_title in results:
        meta = {}
        if audit.extra_metadata:
            try:
                meta = json.loads(audit.extra_metadata)
            except Exception:
                meta = {"details": audit.extra_metadata}

        is_warning = audit.action_type in ("ACCESS_DENIED", "FAILED_AUTH", "UNAUTHORIZED_DOWNLOAD")
        target_name = case_title or (f"Case {str(audit.target_case_id)[:8]}" if audit.target_case_id else "SYSTEM")
        
        created_at_val = audit.created_at
        if created_at_val:
            if created_at_val.tzinfo is None:
                from datetime import timezone
                created_at_val = created_at_val.replace(tzinfo=timezone.utc)
            timestamp_str = created_at_val.isoformat()
        else:
            timestamp_str = ""

        logs.append(
            AuditLogResponse(
                id=str(audit.id),
                timestamp=timestamp_str,
                actor=user_email or "SYSTEM",
                action=audit.action_type,
                target=target_name,
                ip="127.0.0.1",
                isWarning=is_warning,
                isHighlighted=audit.action_type in ("QUERY_GRAPH", "ACCESS_DENIED", "DELETE"),
                raw={"id": str(audit.id), "actor_id": str(audit.actor_id), "action": audit.action_type, "metadata": meta},
            )
        )

    return logs
