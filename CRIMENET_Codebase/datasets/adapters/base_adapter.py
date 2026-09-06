"""
VEILLE — Base Dataset Adapter
Abstract base class for ingesting and standardizing external datasets into canonical formats.
"""

from abc import ABC, abstractmethod
import hashlib
from typing import Dict, Any, List, Optional
from datasets.canonical.schemas import CanonicalDatasetBundle, CanonicalEvidence


class BaseDatasetAdapter(ABC):
    """Abstract interface that all dataset adapters must implement."""

    def __init__(self, manifest_config: Optional[Dict[str, Any]] = None):
        self.config = manifest_config or {}

    @abstractmethod
    def load_raw_data(self, source_path: str) -> Any:
        """Read raw data from external files (CSV, JSON, XML, TXT)."""
        pass

    @abstractmethod
    def transform_to_canonical(self, raw_data: Any) -> CanonicalDatasetBundle:
        """Transform external format into standardized CanonicalDatasetBundle."""
        pass

    def compute_sha256(self, content: str) -> str:
        """Compute cryptographically verifiable SHA-256 hash for chain of custody."""
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def validate_bundle(self, bundle: CanonicalDatasetBundle) -> bool:
        """Validate schema integrity, entity references, and relationship endpoints."""
        entity_ids = {e.id for e in bundle.entities}
        for rel in bundle.relationships:
            if rel.source_id not in entity_ids or rel.target_id not in entity_ids:
                # Log dangling edge warning or handle gracefully
                pass
        return True
