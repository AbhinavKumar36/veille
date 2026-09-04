# 14 DATA SYNCHRONIZATION SPECIFICATION

**Status:** IMPLEMENTATION READY — Phase 3, Week 3
**Component:** Data Integrity — PostgreSQL ↔ Neo4j Synchronization
**Phase:** 3 (Data Integrity)

This specification defines the **Outbox Pattern** implementation to keep PostgreSQL (system of record) and Neo4j (knowledge graph) permanently in sync. Without this, data drift and orphaned nodes will silently corrupt investigations.

---

## 1. The Problem

VEILLE uses **polyglot persistence** — PostgreSQL for relational metadata and Neo4j for the graph. Currently, there is no mechanism to ensure they stay in sync. This means:

- A node created in Neo4j may have no corresponding record in Postgres (orphaned graph node)
- Deleting a Case in Postgres leaves the associated Neo4j nodes dangling forever
- If Neo4j write fails after Postgres write, data is in a split-brain state
- Compliance: audit trail is broken if the graph doesn't reflect the relational record

---

## 2. The Outbox Pattern

The Outbox Pattern solves this by treating Neo4j writes as **events** that are committed atomically with the Postgres write. A background worker then processes these events to update Neo4j.

### 2.1 How It Works

```
1. Application writes to Postgres tables (Cases, Evidence, etc.)
2. In the SAME transaction, a record is written to `outbox_events` table
3. Transaction commits atomically — both succeed or both fail
4. A background Celery Beat job polls `outbox_events` every 2 seconds
5. For each unprocessed event, it applies the corresponding change to Neo4j
6. On success, the event is marked `processed=True`
7. On failure, the event retry count is incremented (max 5 retries → DLQ)
```

This guarantees **eventual consistency** with no data loss.

---

## 3. Database Schema — `outbox_events` Table

### Alembic Migration

```python
# backend/alembic/versions/xxxx_add_outbox_events.py

def upgrade():
    op.create_table(
        'outbox_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),      # e.g., 'NODE_UPSERT', 'EDGE_CREATE', 'NODE_DELETE'
        sa.Column('entity_type', sa.String(50), nullable=False),     # e.g., 'Person', 'Evidence', 'Case'
        sa.Column('entity_id', sa.String(255), nullable=False),      # The ID of the entity
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('payload', postgresql.JSONB, nullable=False),      # Full data for the Neo4j operation
        sa.Column('idempotency_key', sa.String(255), nullable=False, unique=True),  # Prevents duplicate processing
        sa.Column('processed', sa.Boolean, server_default='false', nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retry_count', sa.Integer, server_default='0', nullable=False),
        sa.Column('last_error', sa.Text, nullable=True),
    )
    # Index for efficient polling of unprocessed events
    op.create_index('idx_outbox_unprocessed', 'outbox_events',
                    ['processed', 'created_at'],
                    postgresql_where=sa.text('processed = false'))
```

---

## 4. SQLAlchemy Model

```python
# backend/db/models.py — add OutboxEvent model

import uuid
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.sql import func
from .base import Base

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    event_type = Column(String(50), nullable=False)      # NODE_UPSERT | EDGE_CREATE | NODE_DELETE | EDGE_DELETE
    entity_type = Column(String(50), nullable=False)     # Person | Phone | Case | Evidence ...
    entity_id = Column(String(255), nullable=False)
    case_id = Column(UUID(as_uuid=True), nullable=True)
    payload = Column(JSONB, nullable=False)
    idempotency_key = Column(String(255), nullable=False, unique=True)
    processed = Column(Boolean, default=False, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    last_error = Column(Text, nullable=True)
```

---

## 5. Writing to the Outbox

Every service method that modifies graph-relevant data must write an outbox event **in the same transaction**.

### Example — Evidence Ingestion Service

```python
# backend/services/evidence_service.py

import hashlib
import json
from datetime import datetime
from db.models import Evidence, OutboxEvent
from sqlalchemy.orm import Session

def create_evidence_and_outbox(db: Session, case_id: str, file_path: str, source_type: str) -> Evidence:
    evidence = Evidence(
        case_id=case_id,
        file_path=file_path,
        source_type=source_type,
        status="PROCESSING",
    )
    db.add(evidence)
    db.flush()  # Get the evidence.id without committing yet

    # Write outbox event IN THE SAME TRANSACTION
    payload = {
        "evidence_id": str(evidence.id),
        "case_id": str(case_id),
        "source_type": source_type,
        "file_path": file_path,
    }
    idempotency_key = hashlib.sha256(
        f"EVIDENCE_CREATED:{evidence.id}".encode()
    ).hexdigest()

    outbox_event = OutboxEvent(
        event_type="NODE_UPSERT",
        entity_type="Evidence",
        entity_id=str(evidence.id),
        case_id=case_id,
        payload=payload,
        idempotency_key=idempotency_key,
    )
    db.add(outbox_event)
    db.commit()  # Both evidence + outbox event commit atomically
    return evidence
```

---

## 6. Outbox Processor (Celery Beat Job)

```python
# backend/workers/outbox_processor.py

from celery import Celery
from celery.schedules import crontab
from db.session import get_db
from db.models import OutboxEvent
from graph.neo4j_client import Neo4jClient
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
DLQ_KEY = "dlq:outbox_failed"
MAX_RETRIES = 5

@celery_app.task
def process_outbox_events():
    """
    Polls the outbox_events table for unprocessed events and applies them to Neo4j.
    Runs every 2 seconds via Celery Beat.
    """
    db = next(get_db())
    neo4j = Neo4jClient()

    # Fetch up to 100 unprocessed events, ordered by creation time
    events = (
        db.query(OutboxEvent)
        .filter(OutboxEvent.processed == False)
        .filter(OutboxEvent.retry_count < MAX_RETRIES)
        .order_by(OutboxEvent.created_at)
        .limit(100)
        .all()
    )

    for event in events:
        try:
            apply_event_to_neo4j(neo4j, event)
            event.processed = True
            event.processed_at = datetime.now(timezone.utc)
        except Exception as e:
            event.retry_count += 1
            event.last_error = str(e)
            logger.error(f"Outbox event {event.id} failed (attempt {event.retry_count}): {e}")

            if event.retry_count >= MAX_RETRIES:
                # Move to Redis DLQ for manual review
                redis_client.lpush(DLQ_KEY, json.dumps({
                    "outbox_event_id": str(event.id),
                    "event_type": event.event_type,
                    "entity_id": event.entity_id,
                    "last_error": str(e),
                }))
                logger.critical(f"Outbox event {event.id} moved to DLQ after {MAX_RETRIES} failures")

    db.commit()
    neo4j.close()


def apply_event_to_neo4j(neo4j: Neo4jClient, event: OutboxEvent):
    """Dispatches the outbox event to the correct Neo4j operation."""
    if event.event_type == "NODE_UPSERT":
        neo4j.upsert_node(event.entity_type, event.entity_id, event.payload, event.case_id)
    elif event.event_type == "EDGE_CREATE":
        neo4j.create_edge(event.payload)
    elif event.event_type == "NODE_DELETE":
        neo4j.delete_node(event.entity_id, event.case_id)
    elif event.event_type == "EDGE_DELETE":
        neo4j.delete_edge(event.payload)
    else:
        raise ValueError(f"Unknown event_type: {event.event_type}")
```

### Celery Beat Schedule

```python
# backend/workers/celery_config.py

CELERYBEAT_SCHEDULE = {
    "process-outbox-every-2-seconds": {
        "task": "workers.outbox_processor.process_outbox_events",
        "schedule": 2.0,  # Every 2 seconds
    },
}
```

---

## 7. Idempotency

Every outbox event has a **unique `idempotency_key`**. If a network issue causes the same event to be written twice (e.g., after a retry), the `UNIQUE` constraint on `idempotency_key` prevents duplicate rows. This means Neo4j operations are safe to replay without creating duplicate nodes.

**Neo4j MERGE (not CREATE):**
```cypher
// Always use MERGE to prevent duplicates even if the outbox event is replayed
MERGE (n:Person {id: $id, case_id: $case_id})
ON CREATE SET n += $properties
ON MATCH  SET n += $properties
```

---

## 8. Cascade Delete Behavior

When a Case is deleted, all associated Neo4j nodes must be cleaned up:

```python
# backend/services/case_service.py

def delete_case(db: Session, case_id: str):
    # 1. Write delete outbox event for all nodes in this case
    outbox_event = OutboxEvent(
        event_type="CASE_DELETE",
        entity_type="Case",
        entity_id=str(case_id),
        case_id=case_id,
        payload={"case_id": str(case_id)},
        idempotency_key=f"CASE_DELETE:{case_id}:{uuid4()}",
    )
    db.add(outbox_event)

    # 2. Delete the case from Postgres (cascades to Evidence, AuditLogs via FK)
    db.query(Case).filter(Case.id == case_id).delete()
    db.commit()
```

**Corresponding Neo4j operation:**
```cypher
// Delete all nodes and relationships for a case
MATCH (n {case_id: $case_id})
DETACH DELETE n
```

---

## 9. Data Sync Checklist (Definition of Done)

- [ ] `outbox_events` table created via Alembic migration (`alembic upgrade head`)
- [ ] Every service method that writes to Neo4j writes an outbox event in the same Postgres transaction
- [ ] Outbox processor Celery Beat job runs every 2 seconds
- [ ] Idempotency key prevents duplicate Neo4j mutations
- [ ] After simulated Postgres restart + recovery, outbox events are re-processed and Neo4j is consistent
- [ ] Deleting a Case removes all associated Neo4j nodes (no orphans remain after `DETACH DELETE`)
- [ ] Events that fail 5 times are routed to Redis DLQ (`dlq:outbox_failed`)
- [ ] Integration test: `test_outbox_sync_creates_neo4j_node()` passes
- [ ] Integration test: `test_outbox_sync_is_idempotent()` passes
