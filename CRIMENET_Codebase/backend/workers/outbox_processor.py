"""
VEILLE v4.0 — Outbox Processor
A Celery Beat task that polls `outbox_events` and applies them to Neo4j.
Ensures eventual consistency between PostgreSQL and Neo4j.
"""
import json
import logging
from datetime import datetime, timezone

from core.database import SessionLocal
from core.graph_db import get_graph_session
from db.models import OutboxEvent
from workers.celery_app import celery_app

logger = logging.getLogger("veille.outbox")

DLQ_KEY = "dlq:outbox_failed"
MAX_RETRIES = 5


def _get_redis_client():
    import os
    import redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return redis.Redis.from_url(redis_url, decode_responses=True)


@celery_app.task(name="process_outbox_events")
def process_outbox_events():
    """
    Polls the outbox_events table for unprocessed events and applies them to Neo4j.
    Runs every 2 seconds via Celery Beat.
    """
    db = SessionLocal()
    graph_session = get_graph_session()
    
    try:
        # Fetch up to 100 unprocessed events
        events = (
            db.query(OutboxEvent)
            .filter(OutboxEvent.status == "PENDING")
            .filter(OutboxEvent.retries < MAX_RETRIES)
            .order_by(OutboxEvent.created_at)
            .limit(100)
            .with_for_update(skip_locked=True)  # Prevent concurrent workers from grabbing the same rows
            .all()
        )

        if not events:
            return

        logger.info(f"Processing {len(events)} outbox events...")
        modified_case_ids = set()

        for event in events:
            try:
                payload = json.loads(event.payload)
                
                if event.event_type == "NODE_UPSERT":
                    _apply_node_upsert(graph_session, payload)
                elif event.event_type == "EDGE_CREATE":
                    _apply_edge_create(graph_session, payload)
                elif event.event_type == "CASE_DELETE":
                    _apply_case_delete(graph_session, payload)
                else:
                    raise ValueError(f"Unknown event_type: {event.event_type}")

                if "case_id" in payload:
                    modified_case_ids.add(payload["case_id"])
                    
                event.status = "PROCESSED"
                event.error_message = None
                
            except Exception as e:
                event.retries += 1
                event.error_message = str(e)
                logger.error(f"Outbox event {event.id} failed (attempt {event.retries}): {e}")

                if event.retries >= MAX_RETRIES:
                    event.status = "FAILED"
                    # Route to DLQ
                    dlq_payload = {
                        "task_id": f"outbox_{event.id}",
                        "task_name": "process_outbox_events",
                        "evidence_id": payload.get("source_evidence_id") or payload.get("case_id"),
                        "error_type": type(e).__name__,
                        "error": str(e),
                        "failed_at": datetime.now(timezone.utc).isoformat(),
                        "args": f"event_type={event.event_type}",
                        "kwargs": event.payload,
                    }
                    try:
                        _get_redis_client().lpush(DLQ_KEY, json.dumps(dlq_payload))
                        logger.critical(f"Outbox event {event.id} moved to DLQ after {MAX_RETRIES} failures")
                    except Exception as redis_err:
                        logger.error(f"Could not push to DLQ: {redis_err}")

        db.commit()
        
        # ── Invalidate Redis Cache for modified case_ids ──────────────────────
        try:
            redis_client = _get_redis_client()
            for case_id in modified_case_ids:
                # Invalidate graph data
                redis_client.delete(f"graph_data:{case_id}")
                # Invalidate analytics for this case
                keys = redis_client.keys(f"graph_analytics:{case_id}:*")
                if keys:
                    redis_client.delete(*keys)
                    
                # Broadcast WS update
                redis_client.publish("graph_updates", json.dumps({
                    "case_id": case_id,
                    "event": "graph_updated"
                }))
        except Exception as redis_err:
            logger.error(f"Failed to invalidate cache: {redis_err}")

    finally:
        db.close()
        graph_session.close()


def _apply_node_upsert(session, payload: dict):
    query = f"""
    MERGE (n:{payload['label']} {{id: $id, case_id: $case_id}})
    SET
        n.name = $name,
        n.properties = $properties,
        n.source_evidence_id = $source_evidence_id,
        n.updated_at = timestamp()
    """
    session.run(
        query,
        id=payload['id'],
        case_id=payload['case_id'],
        name=payload['name'],
        properties=json.dumps(payload['properties']),
        source_evidence_id=payload['source_evidence_id']
    )


def _apply_edge_create(session, payload: dict):
    query = f"""
    MATCH (source {{id: $source_id, case_id: $case_id}})
    MATCH (target {{id: $target_id, case_id: $case_id}})
    MERGE (source)-[r:{payload['type']}]->(target)
    SET
        r.confidence = $confidence,
        r.properties = $properties,
        r.source_evidence_id = $source_evidence_id,
        r.updated_at = timestamp()
    """
    session.run(
        query,
        source_id=payload['source_id'],
        target_id=payload['target_id'],
        case_id=payload['case_id'],
        confidence=payload['confidence'],
        properties=json.dumps(payload['properties']),
        source_evidence_id=payload['source_evidence_id']
    )


def _apply_case_delete(session, payload: dict):
    query = """
    MATCH (n {case_id: $case_id})
    DETACH DELETE n
    """
    session.run(query, case_id=payload['case_id'])
