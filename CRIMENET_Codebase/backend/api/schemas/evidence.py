from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class EvidenceUploadResponse(BaseModel):
    status: str = Field(description="Current processing status")
    evidence_id: UUID = Field(description="The internal ID assigned to this evidence")
    job_id: str = Field(description="The Celery async job ID for tracking")
