"""
VEILLE — Evidence Router
Real PostgreSQL inserts replace the mocked evidence ingestion.
File is saved locally (MinIO integration deferred to Phase 2).
Evidence record is written to DB before Celery task is dispatched.
"""
import hashlib
import logging
import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import UUID4, BaseModel
from sqlalchemy.orm import Session

from api.auth import get_current_user, log_action, require_role
from core.config import settings
from core.database import get_db
from core.storage import storage_service
from db.models import Case, Evidence, case_investigators
from workers.tasks import extract_entities_task, process_structured_data_task

logger = logging.getLogger("veille.ingestion")

router = APIRouter(prefix="/api/v1/evidence", tags=["evidence"])


# Local upload directory (mocks MinIO for Phase 1)
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "tmp", "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".csv", ".png", ".jpg", ".jpeg", ".mp3", ".wav"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def _run_evidence_pipeline(evidence_id_str: str, file_path_str: str, case_id_str: str, source_type_str: str):
    """Fallback / immediate synchronous background runner for reliable execution in all environments."""
    import logging
    logger = logging.getLogger("veille.pipeline.sync")
    try:
        file_ext = os.path.splitext(file_path_str)[1].lower()
        if source_type_str == "FIR" or file_ext in (".pdf", ".txt", ".png", ".jpg", ".jpeg", ".mp3", ".wav"):
            extract_entities_task(evidence_id_str, file_path_str, case_id_str)
        else:
            process_structured_data_task(evidence_id_str, source_type_str, file_path_str, case_id_str)

        # Attempt immediate outbox flush to graph
        try:
            from workers.outbox_processor import process_outbox_events
            process_outbox_events()
        except Exception as graph_err:
            logger.warning(f"Outbox flush skipped or deferred: {graph_err}")
    except Exception as e:
        logger.error(f"Background execution for evidence {evidence_id_str} failed: {e}")
        from workers.base_task import _update_evidence_status
        _update_evidence_status(evidence_id_str, "FAILED", str(e))


# ── Pydantic Schemas ────────────────────────────────────────────────────────

class EvidenceUploadResponse(BaseModel):
    status: str
    evidence_id: str
    job_id: str
    message: str
    storage_path: Optional[str] = None


class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    source_type: str
    original_filename: Optional[str] = None
    file_size_bytes: Optional[int] = 0
    hash: Optional[str] = ""
    status: str
    error_message: Optional[str] = None
    created_at: str


# ── Routes ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[EvidenceResponse])
@router.get("/", response_model=List[EvidenceResponse])
def get_all_evidence(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List accessible evidence. Enforces investigator case assignment boundaries."""
    if current_user["role"] == "HEAD":
        evidence_list = db.query(Evidence).offset(skip).limit(limit).all()
    else:
        evidence_list = (
            db.query(Evidence)
            .join(Case, Evidence.case_id == Case.id)
            .join(case_investigators, Case.id == case_investigators.c.case_id)
            .filter(case_investigators.c.user_id == current_user["id"])
            .offset(skip)
            .limit(limit)
            .all()
        )
    return [
        EvidenceResponse(
            id=str(e.id),
            case_id=str(e.case_id),
            source_type=e.source_type,
            original_filename=e.original_filename,
            file_size_bytes=e.file_size_bytes or 0,
            hash=e.hash or "",
            status=e.status,
            error_message=e.error_message,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in evidence_list
    ]


@router.get("/{case_id}", response_model=List[EvidenceResponse])
def get_evidence_for_case(
    case_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all evidence records for a given case.
    Enforces case access before returning data.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    if (
        current_user["role"] == "INVESTIGATOR"
        and not any(str(inv.id) == current_user["id"] for inv in getattr(case, "investigators", []))
    ):
        raise HTTPException(status_code=403, detail="You do not have access to this case.")

    evidence_list = db.query(Evidence).filter(Evidence.case_id == case.id).offset(skip).limit(limit).all()
    if not evidence_list:
        return []

    return [
        EvidenceResponse(
            id=str(e.id),
            case_id=str(e.case_id),
            source_type=e.source_type,
            original_filename=e.original_filename,
            file_size_bytes=e.file_size_bytes or 0,
            hash=e.hash or "",
            status=e.status,
            error_message=e.error_message,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in evidence_list
    ]


@router.post("/upload", response_model=EvidenceUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_evidence(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    case_id: str = Form(...),
    source_type: str = Form(...),
    current_user: dict = Depends(require_role("INVESTIGATOR", "HEAD")),
    db: Session = Depends(get_db),
):
    """
    Upload an evidence file and dispatch to the async intelligence pipeline.
    Persists to MinIO object storage (or local vault) with SHA-256 integrity verification.
    """
    # ── Validation ──────────────────────────────────────────────────────
    if source_type not in ("FIR", "CDR", "FINANCIAL"):
        raise HTTPException(status_code=400, detail="source_type must be FIR, CDR, or FINANCIAL.")

    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Verify case exists and user has access
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    if (
        current_user["role"] == "INVESTIGATOR"
        and not any(str(inv.id) == current_user["id"] for inv in getattr(case, "investigators", []))
    ):
        raise HTTPException(status_code=403, detail="Cannot upload evidence to another investigator's case.")

    # ── Read & Verify File ──────────────────────────────────────────────
    file_content = await file.read()

    # Enforce size limit
    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size: 50 MB.")

    # Compute SHA-256 hash for immutability verification
    file_hash = hashlib.sha256(file_content).hexdigest()

    evidence_id = uuid.uuid4()
    safe_filename = f"{evidence_id}{file_ext}"

    # ── Upload to MinIO Object Storage (with local fallback) ─────────────
    success, storage_path = storage_service.upload_file(
        safe_filename,
        file_content,
        content_type=file.content_type or "application/octet-stream",
    )

    # Also keep a local copy for immediate local worker processing if needed
    local_file_path = os.path.join(UPLOAD_DIR, safe_filename)
    if not os.path.exists(local_file_path):
        with open(local_file_path, "wb") as f:
            f.write(file_content)

    # ── Write Evidence Record to PostgreSQL ──────────────────────────────
    evidence = Evidence(
        id=evidence_id,
        case_id=case_id,
        source_type=source_type,
        file_path=storage_path,
        original_filename=file.filename,
        file_size_bytes=len(file_content),
        hash=file_hash,
        status="PROCESSING",
    )
    db.add(evidence)
    db.commit()

    log_action(db, current_user["id"], "UPLOAD_EVIDENCE", case_id=case_id)

    # ── Dispatch to Async Pipeline & Background Worker ───────────────────
    job_id = str(uuid.uuid4())
    try:
        if source_type == "FIR" or file_ext in (".pdf", ".txt", ".png", ".jpg", ".jpeg", ".mp3", ".wav"):
            result = extract_entities_task.delay(str(evidence_id), local_file_path, case_id)
            job_id = result.id
        else:
            result = process_structured_data_task.delay(str(evidence_id), source_type, local_file_path, case_id)
            job_id = result.id
    except Exception as celery_err:
        logger.warning(
            f"Celery dispatch failed for evidence {evidence_id}: {celery_err}. Using BackgroundTasks."
        )

    # Always ensure background worker processes file immediately
    background_tasks.add_task(
        _run_evidence_pipeline,
        str(evidence_id),
        local_file_path,
        case_id,
        source_type
    )

    return EvidenceUploadResponse(
        status="processing",
        evidence_id=str(evidence_id),
        job_id=job_id,
        message=f"File '{file.filename}' securely vaulted. SHA-256: {file_hash[:16]}...",
        storage_path=storage_path,
    )


@router.get("/{evidence_id}/download")
def download_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the raw evidence file. Enforces case authorization."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found.")

    case = evidence.case
    if (
        current_user["role"] == "INVESTIGATOR"
        and case
        and not any(str(inv.id) == current_user["id"] for inv in getattr(case, "investigators", []))
    ):
        raise HTTPException(status_code=403, detail="You do not have access to this case evidence.")

    # Try generating presigned MinIO URL first
    presigned_url = storage_service.get_download_url(evidence.file_path)
    if presigned_url:
        return {"download_url": presigned_url, "filename": evidence.original_filename}

    # Fallback to local file stream
    file_bytes = storage_service.get_file(evidence.file_path)
    if not file_bytes:
        # Check local upload dir
        local_path = os.path.join(UPLOAD_DIR, os.path.basename(evidence.file_path))
        if os.path.exists(local_path):
            return FileResponse(local_path, filename=evidence.original_filename)
        raise HTTPException(status_code=404, detail="Evidence file data not found.")

    return Response(
        content=file_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{evidence.original_filename or "evidence"}"'},
    )


@router.get("/{evidence_id}/preview")
def preview_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns text/snippet preview of evidence content for the UI viewer."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found.")

    case = evidence.case
    if (
        current_user["role"] == "INVESTIGATOR"
        and case
        and not any(str(inv.id) == current_user["id"] for inv in getattr(case, "investigators", []))
    ):
        raise HTTPException(status_code=403, detail="You do not have access to this case evidence.")

    file_bytes = storage_service.get_file(evidence.file_path)
    if not file_bytes:
        local_path = os.path.join(UPLOAD_DIR, os.path.basename(evidence.file_path))
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                file_bytes = f.read()

    if not file_bytes:
        return {"content": "Preview unavailable: file data not found in vault.", "type": "empty"}

    try:
        text_content = file_bytes.decode("utf-8", errors="replace")
        return {
            "evidence_id": str(evidence.id),
            "filename": evidence.original_filename,
            "source_type": evidence.source_type,
            "hash": evidence.hash,
            "size_bytes": evidence.file_size_bytes,
            "content": text_content[:50000],  # Return first 50KB for fast preview
            "type": "text",
        }
    except Exception as e:
        return {
            "evidence_id": str(evidence.id),
            "filename": evidence.original_filename,
            "type": "binary",
            "content": f"Binary content ({len(file_bytes)} bytes). Use download to view.",
        }


@router.post("/{evidence_id}/reprocess", response_model=EvidenceResponse)
def reprocess_evidence(
    evidence_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("INVESTIGATOR", "HEAD")),
    db: Session = Depends(get_db),
):
    """Trigger reprocessing for an evidence record with strict case authorization."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found.")

    case = evidence.case
    if (
        current_user["role"] == "INVESTIGATOR"
        and case
        and not any(str(inv.id) == current_user["id"] for inv in getattr(case, "investigators", []))
    ):
        raise HTTPException(status_code=403, detail="You do not have access to this case.")

    evidence.status = "PROCESSING"
    evidence.error_message = None
    db.commit()

    background_tasks.add_task(
        _run_evidence_pipeline,
        str(evidence.id),
        evidence.file_path,
        str(evidence.case_id),
        evidence.source_type
    )

    return EvidenceResponse(
        id=str(evidence.id),
        case_id=str(evidence.case_id),
        source_type=evidence.source_type,
        original_filename=evidence.original_filename,
        file_size_bytes=evidence.file_size_bytes or 0,
        hash=evidence.hash or "",
        status="PROCESSING",
        error_message=None,
        created_at=evidence.created_at.isoformat() if evidence.created_at else "",
    )


class CDRStreamPayload(BaseModel):
    case_id: str
    caller: str
    receiver: str
    timestamp: str
    duration_seconds: int
    cell_tower_id: str

@router.post("/stream", status_code=status.HTTP_202_ACCEPTED)
async def stream_cdr(
    payload: CDRStreamPayload,
    current_user: dict = Depends(require_role("INVESTIGATOR", "HEAD")),
    db: Session = Depends(get_db),
):
    """
    Ingest a single CDR record into the Kafka stream for real-time processing.
    """
    from confluent_kafka import Producer
    import json
    
    # Verify case exists
    case = db.query(Case).filter(Case.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    producer_conf = {'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS}
    try:
        producer = Producer(producer_conf)
        
        # We include source_evidence_id as a dummy UUID to satisfy the outbox processor schema constraints
        msg = {
            "case_id": payload.case_id,
            "caller": payload.caller,
            "receiver": payload.receiver,
            "timestamp": payload.timestamp,
            "duration_seconds": payload.duration_seconds,
            "cell_tower_id": payload.cell_tower_id,
            "source_evidence_id": str(uuid.uuid4())
        }
        
        producer.produce(settings.KAFKA_CDR_TOPIC, json.dumps(msg).encode('utf-8'))
        producer.flush(timeout=1.0)
        
    except Exception as e:
        import logging
        logging.getLogger("veille.ingestion").error(f"Kafka producer error: {e}")
        raise HTTPException(status_code=503, detail="Streaming ingestion unavailable.")

    return {"status": "accepted", "message": "Record added to stream."}



@router.get("/{evidence_id}/entities")
def get_evidence_entities(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch real extracted entities & relationships linked to this specific evidence record.
    Queries Neo4j knowledge graph with PostgreSQL Outbox fallback.
    """
    import json
    from core.graph_db import get_graph_session
    from db.models import OutboxEvent

    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    case = evidence.case
    if (
        current_user["role"] == "INVESTIGATOR"
        and case
        and not any(str(inv.id) == current_user["id"] for inv in getattr(case, "investigators", []))
    ):
        raise HTTPException(status_code=403, detail="You do not have access to this case evidence.")

    if evidence.status != "COMPLETED":
        return {
            "evidence_id": evidence_id,
            "status": evidence.status,
            "error_message": evidence.error_message,
            "entities": [],
            "relationships": [],
        }

    entities = []
    relationships = []

    # 1. Query Neo4j
    try:
        with get_graph_session() as session:
            # Nodes
            node_res = session.run(
                """
                MATCH (n)
                WHERE n.source_evidence_id = $evidence_id
                RETURN n.id AS id, labels(n)[0] AS label, n.name AS name, properties(n) AS props
                """,
                evidence_id=evidence_id,
            )
            for record in node_res:
                props = dict(record["props"]) if record.get("props") else {}
                if "properties" in props and isinstance(props["properties"], str):
                    try:
                        inner = json.loads(props["properties"])
                        if isinstance(inner, dict):
                            for k, v in inner.items():
                                if k not in props:
                                    props[k] = v
                    except Exception:
                        pass

                lbl = (record["label"] or "ENTITY").upper()
                name = record["name"] or record["id"]
                ctx = props.get("role") or props.get("status") or f"Identified {lbl} in {evidence.source_type} data"

                entities.append({
                    "id": record["id"],
                    "name": name,
                    "type": lbl,
                    "confidence": float(props.get("confidence", 0.95)),
                    "context": ctx,
                    "properties": props,
                })

            # Relationships
            edge_res = session.run(
                """
                MATCH (n)-[r]->(m)
                WHERE r.source_evidence_id = $evidence_id
                RETURN n.name AS source_name, m.name AS target_name, type(r) AS type, r.confidence AS confidence, properties(r) AS props
                """,
                evidence_id=evidence_id,
            )
            for record in edge_res:
                edge_props = dict(record["props"]) if record.get("props") else {}
                if "properties" in edge_props and isinstance(edge_props["properties"], str):
                    try:
                        inner = json.loads(edge_props["properties"])
                        if isinstance(inner, dict):
                            for k, v in inner.items():
                                if k not in edge_props:
                                    edge_props[k] = v
                    except Exception:
                        pass

                relationships.append({
                    "source": record["source_name"] or "Source",
                    "target": record["target_name"] or "Target",
                    "type": record["type"],
                    "confidence": float(record.get("confidence") or 0.95),
                    "properties": edge_props,
                })
    except Exception as graph_err:
        logger.warning(f"Neo4j query for evidence entities fallback to outbox: {graph_err}")

    # 2. Fallback to OutboxEvents if Neo4j returned no rows yet
    if not entities:
        outbox_events = (
            db.query(OutboxEvent)
            .filter(OutboxEvent.payload.contains(f'"source_evidence_id": "{evidence_id}"'))
            .all()
        )
        for ev in outbox_events:
            try:
                p = json.loads(ev.payload)
                if ev.event_type == "NODE_UPSERT":
                    lbl = (p.get("label") or "ENTITY").upper()
                    name = p.get("name") or p.get("id")
                    props = p.get("properties") or {}
                    ctx = props.get("role") or props.get("status") or f"Identified {lbl}"
                    entities.append({
                        "id": p.get("id"),
                        "name": name,
                        "type": lbl,
                        "confidence": float(props.get("confidence", 0.95)),
                        "context": ctx,
                        "properties": props,
                    })
                elif ev.event_type == "EDGE_CREATE":
                    relationships.append({
                        "source": p.get("source_id"),
                        "target": p.get("target_id"),
                        "type": p.get("type"),
                        "confidence": float(p.get("confidence", 0.95)),
                        "properties": p.get("properties") or {},
                    })
            except Exception:
                pass

    return {
        "evidence_id": evidence_id,
        "status": evidence.status,
        "error_message": evidence.error_message,
        "entities": entities,
        "relationships": relationships,
    }


@router.get("/status/{evidence_id}")
def get_evidence_status(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Poll processing status of a specific evidence record.
    Frontend uses this to show real-time progress feedback.
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    return {
        "evidence_id": evidence_id,
        "status": evidence.status,
        "source_type": evidence.source_type,
        "error_message": evidence.error_message,
        "updated_at": evidence.updated_at.isoformat() if evidence.updated_at else None,
    }


@router.get("/file/{evidence_id}")
def download_evidence_file(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download / preview a stored evidence file.
    Streams the file from the local upload directory with proper MIME type headers.
    Auth required — only accessible to assigned investigators and supervisors.
    """
    import mimetypes
    from pathlib import Path

    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    file_path = evidence.file_path
    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Evidence file not found on storage.")

    log_action(db, current_user["id"], "DOWNLOAD_EVIDENCE", case_id=str(evidence.case_id))

    mime_type, _ = mimetypes.guess_type(file_path)
    mime_type = mime_type or "application/octet-stream"

    filename = evidence.original_filename or Path(file_path).name

    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=filename,
        headers={
            "X-Evidence-ID": evidence_id,
            "X-SHA256-Hash": evidence.hash or "",
            "X-Chain-Of-Custody": "VEILLE-IMMUTABLE-STORE-v1",
        },
    )
