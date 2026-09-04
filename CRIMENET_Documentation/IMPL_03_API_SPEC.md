# 03 API SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Application Engine

This specification defines the FastAPI REST routes required for the **Data Ingestion Pipeline** (Step 4).

## 1. Ingestion Endpoint (`/api/v1/evidence/upload`)

This endpoint is responsible for accepting unstructured (PDF/TXT) and structured (CSV) data, saving it, and dispatching it to the asynchronous intelligence pipeline.

**Method:** `POST`
**Content-Type:** `multipart/form-data`

### 1.1 Request Payload
*   `file`: The binary file being uploaded (PDF, TXT, CSV).
*   `case_id`: UUID (Required to enforce data isolation).
*   `source_type`: String (Enum: `FIR`, `CDR`, `FINANCIAL`).

### 1.2 Response Payload
The endpoint must return rapidly to prevent blocking the UI. It returns a `202 Accepted` status.

```json
{
  "status": "processing",
  "evidence_id": "uuid-from-postgres",
  "job_id": "uuid-from-celery"
}
```

### 1.3 Asynchronous Dispatch Logic

Because VEILLE uses a hybrid AI architecture, we do not pass structured data through the LLM/NLP worker.

1.  **If `source_type` is `FIR` or file is PDF/TXT:**
    *   Dispatch to `extract_entities_task` (NLP Worker).
2.  **If `source_type` is `CDR` or `FINANCIAL` or file is CSV:**
    *   Dispatch to `process_structured_data_task` (Bypasses NLP, goes directly to Entity Resolution).

## 2. Pydantic Models

All requests must be strictly validated using Pydantic before touching the database or message broker.

```python
class EvidenceUploadResponse(BaseModel):
    status: str
    evidence_id: UUID
    job_id: str
```
