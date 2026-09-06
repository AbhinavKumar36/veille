"""
VEILLE v4.0 — NLP Extraction Schemas
Pydantic models that enforce constrained output from the Gemini LLM.
These schemas are used as the response_schema for the Gemini API call,
ensuring the LLM can ONLY produce valid entity types and relationship types.
"""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
import hashlib


ALLOWED_ENTITY_LABELS = Literal[
    "Person", "Phone", "Account", "Vehicle",
    "Organization", "Location", "Event"
]

ALLOWED_RELATIONSHIP_TYPES = Literal[
    "ASSOCIATED_WITH", "OWNS", "COMMUNICATES_WITH",
    "LOCATED_AT", "PARTICIPATED_IN"
]


class ExtractedEntity(BaseModel):
    id: str = Field(
        description=(
            "Unique local identifier. Format: {Label}_{name_slug}. "
            "Example: 'Person_RajeshKumar', 'Phone_9876543210'. "
            "Must be unique within this extraction."
        )
    )
    label: ALLOWED_ENTITY_LABELS = Field(
        description="Entity type. ONLY use one of the 7 allowed types."
    )
    name: str = Field(
        description="The literal text representation of the entity as it appears in the document."
    )
    properties: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional attributes. E.g. {age: 45} for Person, {plate: 'MH04-1234'} for Vehicle, {lat: 19.076, lng: 72.877} for Location."
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_entity(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "label" not in data and "type" in data:
                t = str(data["type"]).capitalize()
                data["label"] = t if t in ("Person", "Phone", "Account", "Vehicle", "Organization", "Location", "Event") else "Person"
            elif "label" in data:
                l = str(data["label"]).capitalize()
                data["label"] = l if l in ("Person", "Phone", "Account", "Vehicle", "Organization", "Location", "Event") else "Person"
            if "properties" not in data or data["properties"] is None:
                data["properties"] = {}
        return data

    @field_validator("id")
    @classmethod
    def sanitize_id(cls, v: str) -> str:
        """Strip spaces and special chars that would break Neo4j node IDs."""
        return v.replace(" ", "_").replace("-", "_")


class ExtractedRelation(BaseModel):
    source_id: str = Field(description="Must match the 'id' of an entity in the entities list.")
    target_id: str = Field(description="Must match the 'id' of an entity in the entities list.")
    type: ALLOWED_RELATIONSHIP_TYPES = Field(
        description="Relationship type. ONLY use one of the 5 allowed types."
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0, le=1.0,
        description="Your confidence in this relationship (0.0 = uncertain, 1.0 = certain)."
    )
    properties: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional metadata. E.g. {timestamp: '2024-01-15T14:00:00', duration_seconds: 120} for calls."
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_relation(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "source_id" not in data and "source" in data:
                data["source_id"] = data["source"]
            if "target_id" not in data and "target" in data:
                data["target_id"] = data["target"]
            if "confidence" not in data or data["confidence"] is None:
                data["confidence"] = 0.95
            if "type" in data:
                t = str(data["type"]).upper().replace(" ", "_")
                data["type"] = t if t in ("ASSOCIATED_WITH", "OWNS", "COMMUNICATES_WITH", "LOCATED_AT", "PARTICIPATED_IN") else "ASSOCIATED_WITH"
            if "properties" not in data or data["properties"] is None:
                data["properties"] = {}
        return data


class ExtractedGraph(BaseModel):
    entities: List[ExtractedEntity] = Field(
        description="All entities found in the document."
    )
    relationships: List[ExtractedRelation] = Field(
        description="All relationships between entities found in the document."
    )

    def is_empty(self) -> bool:
        return len(self.entities) == 0
