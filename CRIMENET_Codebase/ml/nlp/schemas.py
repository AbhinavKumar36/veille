"""
VEILLE v4.0 — NLP Extraction Schemas
Pydantic models that enforce constrained output from the Gemini LLM.
These schemas are used as the response_schema for the Gemini API call,
ensuring the LLM can ONLY produce valid entity types and relationship types.
"""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator
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
    properties: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="Additional attributes. E.g. {age: 45} for Person, {plate: 'MH04-1234'} for Vehicle."
    )

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
        ge=0.0, le=1.0,
        description="Your confidence in this relationship (0.0 = uncertain, 1.0 = certain)."
    )
    properties: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="Optional metadata. E.g. {timestamp: '2024-01-15T14:00:00', duration_seconds: 120} for calls."
    )


class ExtractedGraph(BaseModel):
    entities: List[ExtractedEntity] = Field(
        description="All entities found in the document."
    )
    relationships: List[ExtractedRelation] = Field(
        description="All relationships between entities found in the document."
    )

    def is_empty(self) -> bool:
        return len(self.entities) == 0
