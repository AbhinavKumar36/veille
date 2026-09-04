"""
VEILLE v4.0 — Celery Base Task
All VEILLE Celery tasks inherit from this class.

Provides:
  - Automatic retry (max 3 attempts, exponential backoff)
  - Evidence status update to FAILED on permanent failure
  - Dead Letter Queue (DLQ) routing via Redis
  - Structured JSON logging for every task lifecycle event
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import redis
from celery import Task

logger = logging.getLogger("veille.celery")

DLQ_KEY = "dlq:failed_jobs"


def _get_redis_client():
    """Lazy Redis client to avoid import-time connection errors."""
    import os
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return redis.Redis.from_url(redis_url, decode_responses=True)


def _update_evidence_status(evidence_id: str, status: str, error_msg: str = "") -> None:
    """Update the Evidence record status in PostgreSQL. Safe to call from any worker."""
    try:
        import sys, os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from core.database import SessionLocal
        from db.models import Evidence

        db = SessionLocal()
        try:
            evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
            if evidence:
                evidence.status = status
                if error_msg:
                    evidence.error_message = error_msg[:1000]  # Truncate to DB column size
                db.commit()
                logger.info(f"Evidence {evidence_id} status → {status}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Could not update evidence {evidence_id} status to {status}: {e}")


class CrimenetBaseTask(Task):
    """
    Mixin class for all VEILLE Celery tasks.

    Usage:
        @celery_app.task(bind=True, base=CrimenetBaseTask, name="my_task")
        def my_task(self, evidence_id: str, ...):
            ...

    Retry behaviour:
        - Max 3 retries (4 total attempts)
        - Backoff: 30s → 90s → 270s (3× each time)
        - GeminiAPIError → retry (transient)
        - ExtractionValidationError → no retry → DLQ immediately
        - All other exceptions → retry

    DLQ:
        Permanently failed jobs are pushed to Redis list `dlq:failed_jobs`.
        Use GET /api/v1/admin/dlq to inspect and retry them.
    """

    abstract = True
    max_retries = 3
    default_retry_delay = 30   # seconds

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Called by Celery after all retries are exhausted.
        1. Updates Evidence status to FAILED in PostgreSQL.
        2. Pushes a DLQ entry to Redis.
        """
        evidence_id = kwargs.get("evidence_id") or (args[0] if args else None)

        logger.error(
            "Celery task permanently failed",
            extra={
                "task_id": task_id,
                "task_name": self.name,
                "evidence_id": evidence_id,
                "error_type": type(exc).__name__,
                "error": str(exc),
            },
        )

        # 1. Mark Evidence as FAILED in PostgreSQL
        if evidence_id:
            _update_evidence_status(
                evidence_id,
                status="FAILED",
                error_msg=f"{type(exc).__name__}: {exc}",
            )

        # 2. Push to Dead Letter Queue
        try:
            dlq_entry = {
                "task_id": task_id,
                "task_name": self.name,
                "evidence_id": evidence_id,
                "error_type": type(exc).__name__,
                "error": str(exc)[:500],
                "failed_at": datetime.now(timezone.utc).isoformat(),
                "args": str(args)[:200],
                "kwargs": str(kwargs)[:200],
            }
            _get_redis_client().lpush(DLQ_KEY, json.dumps(dlq_entry))
            logger.critical(
                f"Task {task_id} added to DLQ '{DLQ_KEY}' "
                f"(evidence_id={evidence_id})"
            )
        except Exception as redis_err:
            logger.error(f"Could not push to DLQ: {redis_err}")

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        evidence_id = kwargs.get("evidence_id") or (args[0] if args else None)
        logger.warning(
            f"Retrying task {self.name} "
            f"(attempt {self.request.retries + 1}/{self.max_retries})",
            extra={
                "task_id": task_id,
                "evidence_id": evidence_id,
                "error": str(exc),
            },
        )

    def on_success(self, retval, task_id, args, kwargs):
        evidence_id = kwargs.get("evidence_id") or (args[0] if args else None)
        logger.info(
            f"Task {self.name} completed successfully",
            extra={"task_id": task_id, "evidence_id": evidence_id},
        )
