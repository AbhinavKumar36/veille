"""
VEILLE — Canonical Dataset Schemas
Defines standardized data exchange models across external datasets
(InLegalNER, ICIJ Offshore Leaks, Enron Emails, IBM AML, Police FIRs).
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CanonicalEvidenceType(str, Enum):
    FIR = "FIR"
    CDR = "CDR"
    FINANCIAL = "FINANCIAL"
    EMAIL = "EMAIL"
    CORPORATE_REGISTRY = "CORPORATE_REGISTRY"
    COURT_RECORD = "COURT_RECORD"
    INTERCEPT = "INTERCEPT"


class CanonicalEvidence(BaseModel):
    evidence_id: str
    source_name: str
    evidence_type: CanonicalEvidenceType
    raw_content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    sha256_hash: Optional[str] = None
    ingestion_timestamp: datetime = Field(default_factory=datetime.utcnow)


class CanonicalEntity(BaseModel):
    id: str
    label: str  # Person, Organization, Location, Phone, Account, Vehicle, Event, Statute, LegalInstrument
    name: str
    aliases: List[str] = Field(default_factory=list)
    properties: Dict[str, Any] = Field(default_factory=dict)
    evidence_sources: List[str] = Field(default_factory=list)
    confidence: float = 1.0


class CanonicalRelationship(BaseModel):
    source_id: str
    target_id: str
    type: str  # OWNS, ASSOCIATED_WITH, COMMUNICATES_WITH, LOCATED_AT, PARTICIPATED_IN, TRANSFERRED_FUNDS
    confidence: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)
    evidence_sources: List[str] = Field(default_factory=list)


class CanonicalEvent(BaseModel):
    event_id: str
    event_type: str
    timestamp: Optional[datetime] = None
    location_id: Optional[str] = None
    participants: List[str] = Field(default_factory=list)
    description: str = ""
    evidence_sources: List[str] = Field(default_factory=list)


class CanonicalDatasetBundle(BaseModel):
    dataset_name: str
    dataset_source: str
    classification: str  # "Real Public Data", "Real Research Corpus", "Synthetic Research Benchmark", "Controlled Synthetic"
    description: str
    evidence_items: List[CanonicalEvidence] = Field(default_factory=list)
    entities: List[CanonicalEntity] = Field(default_factory=list)
    relationships: List[CanonicalRelationship] = Field(default_factory=list)
    events: List[CanonicalEvent] = Field(default_factory=list)
