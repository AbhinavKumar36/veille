# 15 ERROR HANDLING & OBSERVABILITY SPECIFICATION

**Status:** IMPLEMENTATION READY — Phase 2 + Phase 4
**Component:** Infrastructure — DLQ, Celery Error Handling, Logging, Distributed Tracing
**Phase:** 2 (DLQ + Celery) + 4 (OpenTelemetry)

This specification defines the complete error handling contract for VEILLE v4.0, ensuring that no data is silently lost, all failures are visible to investigators, and the system remains debuggable at scale.

---

## 1. Current Problem

VEILLE currently has **silent failures** everywhere:

| Location | Problem |
|---|---|
| `ml/nlp/extractor.py` | Exceptions are swallowed; evidence is stuck at `PROCESSING` forever |
| Celery tasks | No `try/except`; crash leaves job in `PENDING` state indefinitely |
| Kafka consumer | CDR messages dropped without acknowledgment on consumer failure |
| FastAPI routes | Unhandled exceptions return 500 with stack trace exposed to client |
| Neo4j writes | Write failures not caught; graph remains out of sync |

---

## 2. Error Handling Architecture

### 2.1 Three-Layer Error Model

```
Layer 1: FastAPI Exception Handlers (HTTP-level errors)
Layer 2: Celery Task Error Handlers (async task failures)
Layer 3: Dead Letter Queue (permanent failures needing human review)
```

---

## 3. Layer 1 — FastAPI Global Exception Handlers

```python
# backend/api/main.py

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("VEILLE.api")

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions — never expose stack traces to clients."""
    logger.exception(
        "Unhandled exception",
        extra={
            "path": request.url.path,
            "method": request.method,
            "error": str(exc),
        }
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Our team has been notified.",
            "request_id": request.headers.get("x-request-id"),
        }
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"error": "bad_request", "message": str(exc)})
```

### 2.2 Structured Request Logging (JSON)

All API requests must be logged in structured JSON format:

```python
# backend/core/logging.py

import logging
import json
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if hasattr(record, 'extra'):
            log_entry.update(record.extra)
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

def setup_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logging.root.setLevel(logging.INFO)
    logging.root.addHandler(handler)
```

---

## 4. Layer 2 — Celery Task Error Handling

### 4.1 Base Task Class with Error Handling

```python
# backend/workers/base_task.py

from celery import Task
from db.session import get_db
from db.models import Evidence
import logging
import redis

logger = logging.getLogger("VEILLE.celery")
redis_client = redis.Redis.from_url(settings.REDIS_URL)
DLQ_KEY = "dlq:failed_jobs"

class VEILLEBaseTask(Task):
    """
    Base class for all VEILLE Celery tasks.
    Provides automatic error handling, evidence status updates, and DLQ routing.
    """
    abstract = True
    max_retries = 3
    default_retry_delay = 30  # seconds

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called when task fails after all retries are exhausted."""
        evidence_id = kwargs.get('evidence_id') or (args[0] if args else None)

        logger.error(
            "Celery task permanently failed",
            extra={
                "task_id": task_id,
                "task_name": self.name,
                "evidence_id": evidence_id,
                "error": str(exc),
                "traceback": str(einfo),
            }
        )

        # 1. Update evidence status in Postgres
        if evidence_id:
            db = next(get_db())
            db.query(Evidence).filter(Evidence.id == evidence_id).update(
                {"status": "FAILED", "error_message": str(exc)[:500]}
            )
            db.commit()

        # 2. Route to Dead Letter Queue
        dlq_entry = {
            "task_id": task_id,
            "task_name": self.name,
            "evidence_id": evidence_id,
            "error": str(exc),
            "failed_at": datetime.now(timezone.utc).isoformat(),
            "args": str(args),
            "kwargs": str(kwargs),
        }
        redis_client.lpush(DLQ_KEY, json.dumps(dlq_entry))
        logger.critical(f"Job {task_id} added to DLQ: {DLQ_KEY}")

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(
            f"Retrying task {task_id} (attempt {self.request.retries + 1}/{self.max_retries})",
            extra={"error": str(exc)}
        )
```

### 4.2 NLP Extraction Task (with full error handling)

```python
# backend/workers/tasks.py

@celery_app.task(bind=True, base=VEILLEBaseTask, name="extract_entities_task")
def extract_entities_task(self, evidence_id: str):
    """
    Extracts entities from an evidence document using Gemini API.
    Auto-retries 3 times with 30s delay before routing to DLQ.
    """
    try:
        db = next(get_db())
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            raise ValueError(f"Evidence {evidence_id} not found in database")

        # Fetch file from MinIO
        content = minio_client.get_object(evidence.file_path)

        # Run NLP extraction with Pydantic enforcement
        extracted_graph = extractor.extract(content)

        # Write entities to Neo4j via Outbox
        for entity in extracted_graph.entities:
            create_node_outbox_event(db, entity, evidence.case_id, evidence_id)

        # Update evidence status
        evidence.status = "COMPLETED"
        db.commit()

    except GeminiAPIError as exc:
        # Retry on transient API errors
        raise self.retry(exc=exc, countdown=60)

    except ValidationError as exc:
        # Don't retry Pydantic errors — LLM output is structurally wrong
        logger.error(f"LLM output failed Pydantic validation for evidence {evidence_id}: {exc}")
        raise  # Goes to on_failure → DLQ

    except Exception as exc:
        logger.exception(f"Unexpected error in extract_entities_task for {evidence_id}")
        raise self.retry(exc=exc)
```

---

## 5. Layer 3 — Dead Letter Queue (DLQ)

### 5.1 DLQ Structure

All failed jobs land in Redis lists:

| DLQ Key | Contents |
|---|---|
| `dlq:failed_jobs` | Failed Celery extraction/processing tasks |
| `dlq:outbox_failed` | Outbox events that couldn't sync to Neo4j after 5 retries |
| `dlq:kafka_failed` | Kafka CDR messages that couldn't be processed |

### 5.2 DLQ Review API

```python
# backend/api/routers/admin.py

@router.get("/admin/dlq", dependencies=[Depends(require_role("ADMIN", "SUPERVISOR"))])
async def get_dlq_contents():
    """Returns all items currently in the Dead Letter Queue."""
    items = redis_client.lrange("dlq:failed_jobs", 0, -1)
    return {
        "dlq_size": len(items),
        "items": [json.loads(item) for item in items],
    }

@router.post("/admin/dlq/{job_id}/retry", dependencies=[Depends(require_role("ADMIN"))])
async def retry_dlq_job(job_id: str):
    """Manually requeue a failed job from the DLQ."""
    # Fetch from DLQ, re-dispatch to Celery
    ...
```

### 5.3 DLQ Alerting

When an item is added to the DLQ, the system must:
1. Log a `CRITICAL` level structured log entry
2. Update the `EVIDENCE.status` to `FAILED` in Postgres
3. *(Post-MVP)* Send an email/Slack alert to the assigned investigator

---

## 6. Observability Stack

### 6.1 Metrics to Track

| Metric | How to Measure | Alert Threshold |
|---|---|---|
| DLQ size | `redis_client.llen("dlq:failed_jobs")` | Alert if > 10 |
| Celery task failure rate | Celery Flower UI or Prometheus | Alert if > 5% |
| API p99 latency | OpenTelemetry traces | Alert if > 2s |
| Neo4j query time | OpenTelemetry custom spans | Alert if > 500ms |
| Outbox lag | `COUNT(*) WHERE processed=false` | Alert if > 100 |

### 6.2 OpenTelemetry Span Naming Convention

All custom spans must follow this naming convention:

```python
# Pattern: {service}.{operation}.{entity_type}
# Examples:
"VEILLE.extract.fir"
"VEILLE.resolve.person"
"VEILLE.graph.upsert_node"
"VEILLE.outbox.process_event"
"VEILLE.api.get_graph"
```

### 6.3 Celery Flower (Task Monitoring UI)

Add to docker-compose for real-time Celery monitoring:

```yaml
# Add to docker-compose.dev.yml
flower:
  image: mher/flower:latest
  command: celery flower --broker=redis://redis:6379/0
  ports:
    - "5555:5555"
  depends_on:
    - redis
```

Access at: `http://localhost:5555` — shows all active, pending, failed tasks in real-time.

---

## 7. Error Handling Checklist (Definition of Done)

**Phase 2:**
- [ ] All Celery tasks inherit from `VEILLEBaseTask`
- [ ] Failed task after 3 retries: evidence status = `FAILED` in Postgres + DLQ entry in Redis
- [ ] `GET /admin/dlq` endpoint returns current DLQ contents
- [ ] No evidence record stays stuck in `PROCESSING` forever (add a 10-minute timeout watchdog)
- [ ] All API exceptions return structured JSON (never raw stack traces)
- [ ] All logs are in JSON format with timestamp, level, logger, message

**Phase 4:**
- [ ] OpenTelemetry traces visible in Jaeger for a full ingestion flow
- [ ] Celery Flower UI accessible at `localhost:5555`
- [ ] Structured log output for every Celery task start/success/failure
- [ ] DLQ size metric exposed (can be read programmatically for alerting)
