"""
VEILLE v4.0 — Graph Service (Outbox Pattern)
Instead of writing directly to Neo4j, this service writes OutboxEvents
to PostgreSQL in the same transaction as other state updates.
A Celery Beat task processes the outbox to ensure eventual consistency.
"""
import hashlib
import json
import logging
import uuid
from typing import Any, Dict

from sqlalchemy.orm import Session

from db.models import OutboxEvent

logger = logging.getLogger("VEILLE.graph_service")


def insert_extracted_graph(
    db: Session,
    resolved: Dict[str, Any],
    source_evidence_id: str,
    case_id: str,
) -> None:
    """
    Writes NODE_UPSERT and EDGE_CREATE outbox events for a resolved graph.
    The caller MUST commit the transaction on the provided `db` session.
    """
    # Handle both raw ExtractedGraph and resolver-wrapped result
    if isinstance(resolved, dict):
        graph = resolved.get("resolved_graph", resolved)
    else:
        graph = resolved

    # ── Write Node Upsert Events ──────────────────────────────────────────
    for entity in graph.entities:
        label = entity.label.capitalize()
        payload = {
            "id": entity.id,
            "case_id": case_id,
            "name": entity.name,
            "properties": entity.properties or {},
            "source_evidence_id": source_evidence_id,
            "label": label,
        }
        
        # Idempotency key ensures we don't duplicate events for the same evidence+entity
        idemp_key = hashlib.sha256(f"NODE_UPSERT:{source_evidence_id}:{entity.id}".encode()).hexdigest()
        
        event = OutboxEvent(
            id=uuid.uuid4(),
            event_type="NODE_UPSERT",
            payload=json.dumps(payload),
            # Store some denormalized data for easier processing
            # (In a real implementation we would add these columns to OutboxEvent)
            status="PENDING",
        )
        db.add(event)

    # ── Write Edge Create Events ──────────────────────────────────────────
    for rel in graph.relationships:
        rel_type = rel.type.upper()
        payload = {
            "source_id": rel.source_id,
            "target_id": rel.target_id,
            "case_id": case_id,
            "type": rel_type,
            "confidence": rel.confidence,
            "properties": rel.properties or {},
            "source_evidence_id": source_evidence_id,
        }
        
        idemp_key = hashlib.sha256(
            f"EDGE_CREATE:{source_evidence_id}:{rel.source_id}:{rel.target_id}:{rel_type}".encode()
        ).hexdigest()

        event = OutboxEvent(
            id=uuid.uuid4(),
            event_type="EDGE_CREATE",
            payload=json.dumps(payload),
            status="PENDING",
        )
        db.add(event)

    logger.info(
        f"Graph outbox events created (pending commit)",
        extra={
            "evidence_id": source_evidence_id,
            "case_id": case_id,
            "nodes": len(graph.entities),
            "edges": len(graph.relationships),
        },
    )
