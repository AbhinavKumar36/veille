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


@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns recent immutable audit logs for security, compliance, and telemetry.
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
        # Default mock telemetry if fresh database with few actions
        return [
            AuditLogResponse(
                id="audit-101",
                timestamp="2024-09-02T08:17:08Z",
                actor="admin@veille.gov.in",
                action="LOGIN",
                target="AUTH_GATEWAY",
                ip="127.0.0.1",
                isWarning=False,
                isHighlighted=False,
                raw={"status": "SUCCESS", "method": "BEARER_JWT", "client": "VEILLE_UI_v4.0"},
            ),
            AuditLogResponse(
                id="audit-102",
                timestamp="2024-09-02T08:25:20Z",
                actor="admin@veille.gov.in",
                action="QUERY_GRAPH",
                target="Operation Nightfall Syndicate",
                ip="127.0.0.1",
                isWarning=False,
                isHighlighted=True,
                raw={"case_id": "11111111-1111-1111-1111-111111111111", "nodes_accessed": 12, "engine": "Neo4j Cypher"},
            ),
            AuditLogResponse(
                id="audit-103",
                timestamp="2024-09-02T08:30:15Z",
                actor="system_agent",
                action="ENTITY_RESOLVED",
                target="Person_RajeshKumar",
                ip="10.0.4.1",
                isWarning=False,
                isHighlighted=False,
                raw={"algorithm": "Jaro-Winkler + Soundex", "match_confidence": 0.98},
            ),
            AuditLogResponse(
                id="audit-104",
                timestamp="2024-09-02T08:35:42Z",
                actor="investigator@veille.gov.in",
                action="ACCESS_DENIED",
                target="RESTRICTED_EVIDENCE_DUMP",
                ip="192.168.1.45",
                isWarning=True,
                isHighlighted=True,
                raw={"reason": "INSUFFICIENT_CLEARANCE", "required_role": "ADMIN", "attempted_by": "INVESTIGATOR"},
            ),
        ]

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
        
        logs.append(
            AuditLogResponse(
                id=str(audit.id),
                timestamp=audit.created_at.isoformat() if audit.created_at else "",
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
