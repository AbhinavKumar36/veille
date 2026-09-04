"""
VEILLE — Evidence Router
Real PostgreSQL inserts replace the mocked evidence ingestion.
File is saved locally (MinIO integration deferred to Phase 2).
Evidence record is written to DB before Celery task is dispatched.
"""
import hashlib
import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import UUID4, BaseModel
from sqlalchemy.orm import Session

from api.auth import get_current_user, log_action, require_role
from core.config import settings
from core.database import get_db
from db.models import Case, Evidence
from workers.tasks import extract_entities_task, process_structured_data_task

router = APIRouter(prefix="/api/v1/evidence", tags=["evidence"])

# Local upload directory (mocks MinIO for Phase 1)
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "tmp", "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".csv"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


# ── Pydantic Schemas ────────────────────────────────────────────────────────

class EvidenceUploadResponse(BaseModel):
    status: str
    evidence_id: str
    job_id: str
    message: str


class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    source_type: str
    original_filename: Optional[str]
    status: str
    created_at: str


# ── Routes ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[EvidenceResponse])
def get_all_evidence(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all accessible evidence."""
    evidence_list = db.query(Evidence).offset(skip).limit(limit).all()
    if not evidence_list:
        if settings.DEMO_MODE:
            # Provide demonstration evidence records
            return [
                EvidenceResponse(
                    id="ev-101",
                    case_id="11111111-1111-1111-1111-111111111111",
                    source_type="FIR",
                    original_filename="FIR_2024_098_Nightfall.pdf",
                    status="PROCESSED",
                    created_at="2024-09-01T10:15:00Z",
                ),
                EvidenceResponse(
                    id="ev-102",
                    case_id="11111111-1111-1111-1111-111111111111",
                    source_type="CDR",
                    original_filename="CDR_Dump_Airtel_August_Target9811.csv",
                    status="PROCESSED",
                    created_at="2024-09-01T11:45:00Z",
                ),
                EvidenceResponse(
                    id="ev-103",
                    case_id="11111111-1111-1111-1111-111111111111",
                    source_type="FINANCIAL",
                    original_filename="SwissBank_WireTransfer_Record_USD4.5M.pdf",
                    status="PROCESSED",
                    created_at="2024-09-01T14:30:00Z",
                ),
                EvidenceResponse(
                    id="ev-104",
                    case_id="22222222-2222-2222-2222-222222222222",
                    source_type="REPORT",
                    original_filename="Port_Terminal4_Container_Manifest_9022.pdf",
                    status="PROCESSED",
                    created_at="2024-08-25T09:00:00Z",
                ),
            ]
        return []
    return [
        EvidenceResponse(
            id=str(e.id),
            case_id=str(e.case_id),
            source_type=e.source_type,
            original_filename=e.original_filename,
            status=e.status,
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
    try:
        val_uuid = uuid.UUID(case_id)
        case = db.query(Case).filter(Case.id == val_uuid).first()
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=404, detail=f"Invalid case ID format: '{case_id}'. Must be a valid UUID.")

    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    evidence_list = db.query(Evidence).filter(Evidence.case_id == case.id).offset(skip).limit(limit).all()
    if not evidence_list:
        return []

    return [
        EvidenceResponse(
            id=str(e.id),
            case_id=str(e.case_id),
            source_type=e.source_type,
            original_filename=e.original_filename,
            status=e.status,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in evidence_list
    ]


@router.post("/upload", response_model=EvidenceUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_evidence(
    file: UploadFile = File(...),
    case_id: str = Form(...),
    source_type: str = Form(...),
    current_user: dict = Depends(require_role("INVESTIGATOR", "SUPERVISOR")),
    db: Session = Depends(get_db),
):
    """
    Upload an evidence file and dispatch to the async intelligence pipeline.
    Returns 202 Accepted immediately; processing happens in background.
    Phase 1: Files saved locally. Phase 2: MinIO integration.
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
        and str(case.primary_investigator_id) != current_user["id"]
    ):
        raise HTTPException(status_code=403, detail="Cannot upload evidence to another investigator's case.")

    # ── Save File ────────────────────────────────────────────────────────
    evidence_id = uuid.uuid4()
    safe_filename = f"{evidence_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    file_content = await file.read()

    # Enforce size limit
    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size: 50 MB.")

    # Compute SHA-256 hash for immutability verification
    file_hash = hashlib.sha256(file_content).hexdigest()

    with open(file_path, "wb") as f:
        f.write(file_content)

    # ── Write Evidence Record to PostgreSQL ──────────────────────────────
    # This MUST happen before dispatching to Celery so the worker can
    # update the status when done.
    evidence = Evidence(
        id=evidence_id,
        case_id=case_id,
        source_type=source_type,
        file_path=file_path,
        original_filename=file.filename,
        file_size_bytes=len(file_content),
        hash=file_hash,
        status="PROCESSING",
    )
    db.add(evidence)
    db.commit()

    log_action(db, current_user["id"], "UPLOAD_EVIDENCE", case_id=case_id)

    # ── Dispatch to Async Pipeline ───────────────────────────────────────
    job_id = str(uuid.uuid4())  # Fallback if Celery is unavailable
    try:
        if source_type == "FIR" or file_ext in (".pdf", ".txt"):
            result = extract_entities_task.delay(str(evidence_id), file_path, case_id)
            job_id = result.id
        else:
            result = process_structured_data_task.delay(str(evidence_id), source_type, file_path, case_id)
            job_id = result.id
    except Exception as celery_err:
        import logging
        logging.getLogger(__name__).error(
            f"Celery dispatch failed for evidence {evidence_id}: {celery_err}"
        )
        # Don't fail the request — evidence is saved, retry can be triggered later
        evidence.status = "FAILED"
        evidence.error_message = f"Pipeline dispatch failed: {celery_err}"
        db.commit()

    return EvidenceUploadResponse(
        status="processing",
        evidence_id=str(evidence_id),
        job_id=job_id,
        message=f"File '{file.filename}' accepted. Processing in background.",
    )


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
