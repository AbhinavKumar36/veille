"""
VEILLE v4.0 — SQLAlchemy Models (System of Record)
PostgreSQL is the system of record for all relational metadata.
It does NOT store graph data — that lives in Neo4j.
"""
from datetime import datetime, timezone
import uuid
from typing import List, Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID


class Base(DeclarativeBase):
    pass


class User(Base):
    """
    Manages investigator identity and Role-Based Access Control (RBAC).
    Roles: INVESTIGATOR | SUPERVISOR | AUDITOR | ADMIN
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # bcrypt hash — NEVER store plaintext passwords
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="INVESTIGATOR"
    )  # INVESTIGATOR | SUPERVISOR | AUDITOR | ADMIN
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cases: Mapped[List["Case"]] = relationship(back_populates="primary_investigator")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="actor")


class Case(Base):
    """
    Enforces data isolation. Every piece of evidence and every
    Neo4j graph node belongs to exactly one Case.
    """
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="OPEN"
    )  # OPEN | CLOSED | ARCHIVED
    priority: Mapped[str] = mapped_column(
        String(50), nullable=False, default="MEDIUM"
    )  # CRITICAL | HIGH | MEDIUM | LOW
    primary_investigator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    primary_investigator: Mapped["User"] = relationship(back_populates="cases")
    evidence: Mapped[List["Evidence"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="target_case")


class Evidence(Base):
    """
    Immutable record of uploaded intelligence (FIRs, CDRs, Financial records).
    File content lives in MinIO/S3; this table tracks metadata and processing status.
    """
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    source_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # FIR | CDR | FINANCIAL
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)  # MinIO object key
    original_filename: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(nullable=True)
    hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # SHA-256
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PROCESSING"
    )  # PROCESSING | COMPLETED | FAILED
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    case: Mapped["Case"] = relationship(back_populates="evidence")


class AuditLog(Base):
    """
    Immutable ledger of all actions affecting or reading investigative data.
    Every write (and sensitive read) produces an audit entry.
    The actor_id + action_type + timestamp answer: who did what, when?
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    target_case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("cases.id", ondelete="SET NULL"), nullable=True
    )
    extra_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string (extra context)

    actor: Mapped["User"] = relationship(back_populates="audit_logs")
    target_case: Mapped[Optional["Case"]] = relationship(back_populates="audit_logs")


class OutboxEvent(Base):
    """
    Transactional outbox for reliable Postgres-to-Neo4j syncing.
    Events are written in the same transaction as Postgres updates.
    A Celery task processes them sequentially to update Neo4j.
    """
    __tablename__ = "outbox_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PENDING"
    )  # PENDING | PROCESSED | FAILED
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retries: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
