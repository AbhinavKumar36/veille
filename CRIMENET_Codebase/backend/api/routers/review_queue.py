"""
VEILLE v4.0 — Review Queue & Admin Router
Provides endpoints for:
  - GET  /api/v1/review-queue          — list pending entity merge decisions
  - POST /api/v1/review-queue/{id}/merge  — approve merge of two entities
  - POST /api/v1/review-queue/{id}/reject — reject merge (keep as separate entities)
  - GET  /api/v1/jobs/{job_id}          — Celery task status polling
  - GET  /api/v1/admin/dlq             — inspect Dead Letter Queue (SUPERVISOR+)
  - POST /api/v1/admin/dlq/{task_id}/retry — retry a failed DLQ job
"""
import json
import logging
import uuid

from typing import Optional

import redis
from celery.result import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth import get_current_user, log_action, require_role
from core.config import settings
from core.database import get_db
from workers.celery_app import celery_app

logger = logging.getLogger("VEILLE.review_queue")

router = APIRouter(prefix="/api/v1", tags=["review-queue", "admin"])

DLQ_KEY = "dlq:failed_jobs"
REVIEW_QUEUE_KEY = "review_queue:pending"
REVIEW_HISTORY_KEY = "review_queue:history"


def get_redis() -> redis.Redis:
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


# ── Job Status Polling (Task 2.9) ────────────────────────────────────────────

@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Poll the status of a Celery task by job ID.
    Frontend calls this after upload to show real-time pipeline progress.
    States: PENDING | STARTED | SUCCESS | FAILURE | RETRY
    """
    try:
        result = AsyncResult(job_id, app=celery_app)
        response = {
            "job_id": job_id,
            "status": result.state,
        }

        if result.state == "SUCCESS":
            response["result"] = result.result
        elif result.state == "FAILURE":
            response["error"] = str(result.result)
        elif result.state in ("STARTED", "RETRY"):
            # Include retry count if available
            info = result.info or {}
            response["retries"] = info.get("retries", 0)

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch job status: {e}")


# ── Review Queue (Tasks 2.12, 2.13, 2.14) ────────────────────────────────────

@router.get("/review-queue")
def get_review_queue(
    current_user: dict = Depends(require_role("INVESTIGATOR", "HEAD")),
):
    """
    Returns all pending entity merge decisions waiting for human review.
    These are entities that scored 0.50–0.85 confidence (ambiguous matches).
    """
    r = get_redis()
    items_raw = r.lrange(REVIEW_QUEUE_KEY, 0, -1)

    items = []
    for i, raw in enumerate(items_raw):
        try:
            item = json.loads(raw)
            item["queue_index"] = i
            # Generate a stable review ID from content
            item["review_id"] = str(uuid.uuid5(
                uuid.NAMESPACE_DNS,
                f"{item.get('candidate_id', '')}{item.get('match_id', '')}"
            ))
            items.append(item)
        except json.JSONDecodeError:
            continue

    return {
        "pending_count": len(items),
        "items": items,
    }


class ReviewDecisionRequest(BaseModel):
    review_id: Optional[str] = None
    task_id: Optional[str] = None
    candidate_id: Optional[str] = None
    notes: str = ""


@router.post("/review-queue/merge")
def merge_entity(
    body: ReviewDecisionRequest,
    current_user: dict = Depends(require_role("INVESTIGATOR", "HEAD")),
    db: Session = Depends(get_db),
):
    """
    Approve an entity merge: the candidate entity is merged into the matched entity.
    Neo4j: all relationships of candidate_id are redirected to match_id,
           then candidate node is deleted.
    """
    lookup_id = body.review_id or body.task_id or body.candidate_id or ""
    r = get_redis()
    item = _find_review_item(r, lookup_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found.")

    from core.graph_db import get_graph_session
    try:
        with get_graph_session() as session:
            # Redirect all relationships from candidate to the canonical match node
            session.run(
                """
                MATCH (candidate {id: $candidate_id})
                MATCH (match {id: $match_id})
                // Move outgoing relationships
                OPTIONAL MATCH (candidate)-[r_out]->(other)
                WHERE other <> match
                MERGE (match)-[r_new_out:ASSOCIATED_WITH]->(other)
                SET r_new_out.merged_from = $candidate_id
                DELETE r_out
                WITH candidate, match
                // Move incoming relationships
                OPTIONAL MATCH (other2)-[r_in]->(candidate)
                WHERE other2 <> match
                MERGE (other2)-[r_new_in:ASSOCIATED_WITH]->(match)
                SET r_new_in.merged_from = $candidate_id
                DELETE r_in
                WITH candidate
                // Delete the now-orphaned candidate node
                DELETE candidate
                """,
                candidate_id=item["candidate_id"],
                match_id=item["match_id"],
            )
    except Exception as e:
        logger.error(f"Merge failed for {item['candidate_id']} → {item['match_id']}: {e}")
        raise HTTPException(status_code=500, detail=f"Graph merge failed: {e}")
    finally:
        pass

    _remove_review_item(r, body.review_id)
    log_action(db, current_user["id"], "MERGE_ENTITY", case_id=item.get("case_id"))

    return {
        "status": "merged",
        "candidate_id": item["candidate_id"],
        "merged_into": item["match_id"],
        "reviewed_by": current_user["email"],
    }


@router.post("/review-queue/reject")
def reject_merge(
    body: ReviewDecisionRequest,
    current_user: dict = Depends(require_role("INVESTIGATOR", "HEAD")),
    db: Session = Depends(get_db),
):
    """
    Reject a merge: the candidate entity stays as a separate node in the graph.
    """
    lookup_id = body.review_id or body.task_id or body.candidate_id or ""
    r = get_redis()
    item = _find_review_item(r, lookup_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found.")

    _remove_review_item(r, lookup_id)
    log_action(db, current_user["id"], "REJECT_MERGE", case_id=item.get("case_id"))

    return {
        "status": "rejected",
        "candidate_id": item["candidate_id"],
        "kept_separate_from": item["match_id"],
        "reviewed_by": current_user["email"],
    }


# ── Dead Letter Queue Admin (Task 2.7 / IMPL_15) ─────────────────────────────

@router.get("/admin/dlq", dependencies=[Depends(require_role("HEAD"))])
def get_dlq(current_user: dict = Depends(get_current_user)):
    """
    Inspect all failed jobs currently in the Dead Letter Queue.
    Requires SUPERVISOR or HEAD role.
    """
    r = get_redis()
    items_raw = r.lrange(DLQ_KEY, 0, -1)
    items = []
    for raw in items_raw:
        try:
            items.append(json.loads(raw))
        except json.JSONDecodeError:
            continue
    return {
        "dlq_size": len(items),
        "dlq_count": len(items),
        "items": items,
    }



@router.post("/admin/dlq/{task_id}/retry", dependencies=[Depends(require_role("HEAD"))])
def retry_dlq_job(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually retry a failed Celery task from the DLQ.
    Pulls the task payload from Redis and re-dispatches it.
    Requires SUPERVISOR or HEAD role.
    """
    from workers.tasks import extract_entities_task

    r = get_redis()
    items_raw = r.lrange(DLQ_KEY, 0, -1)

    dlq_item = None
    item_index = -1
    for i, raw in enumerate(items_raw):
        try:
            item = json.loads(raw)
            if item.get("task_id") == task_id:
                dlq_item = item
                item_index = i
                break
        except json.JSONDecodeError:
            continue

    if not dlq_item:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found in DLQ.")

    evidence_id = dlq_item.get("evidence_id")
    task_name = dlq_item.get("task_name", "")

    # Re-dispatch based on original task name
    try:
        if "extract_entities" in task_name:
            kwargs = json.loads(dlq_item.get("kwargs", "{}")) if dlq_item.get("kwargs", "{}").startswith("{") else {}
            new_result = extract_entities_task.delay(
                evidence_id=evidence_id,
                **{k: v for k, v in kwargs.items() if k != "evidence_id"},
            )
        else:
            new_result = extract_entities_task.delay(evidence_id=evidence_id)

        # Remove from DLQ
        r.lrem(DLQ_KEY, 1, items_raw[item_index])
        log_action(db, current_user["id"], "DLQ_RETRY", case_id=None)

        return {
            "status": "requeued",
            "old_task_id": task_id,
            "new_job_id": new_result.id,
            "evidence_id": evidence_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to requeue task: {e}")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _find_review_item(r: redis.Redis, review_id: str) -> Optional[dict]:
    """Find a review item by its review_id, candidate_id, or task_id."""
    import uuid as _uuid
    items_raw = r.lrange(REVIEW_QUEUE_KEY, 0, -1)
    for raw in items_raw:
        try:
            item = json.loads(raw)
            item_review_id = str(_uuid.uuid5(
                _uuid.NAMESPACE_DNS,
                f"{item.get('candidate_id', '')}{item.get('match_id', '')}"
            ))
            if (
                item_review_id == review_id
                or item.get("candidate_id") == review_id
                or item.get("task_id") == review_id
                or item.get("id") == review_id
            ):
                item["_raw"] = raw
                return item
        except Exception:
            continue
    return None


def _remove_review_item(r: redis.Redis, review_id: str) -> None:
    """Remove a processed review item from the Redis queue."""
    import uuid as _uuid
    items_raw = r.lrange(REVIEW_QUEUE_KEY, 0, -1)
    for raw in items_raw:
        try:
            item = json.loads(raw)
            item_review_id = str(_uuid.uuid5(
                _uuid.NAMESPACE_DNS,
                f"{item.get('candidate_id', '')}{item.get('match_id', '')}"
            ))
            if (
                item_review_id == review_id
                or item.get("candidate_id") == review_id
                or item.get("task_id") == review_id
                or item.get("id") == review_id
            ):
                r.lrem(REVIEW_QUEUE_KEY, 1, raw)
                # Archive to history
                r.lpush(REVIEW_HISTORY_KEY, raw)
                return
        except Exception:
            continue


# Fix missing Optional import at top-level
from typing import Optional
