"""
VEILLE — InLegalNER Dataset Adapter
Transforms Indian Legal Documents Corpus (ILDC / InLegalNER) structured annotations
and Indian Court judgements / FIR text into VEILLE Canonical graph models.
"""

import json
import os
import re
from typing import Any, Dict, List
from datasets.adapters.base_adapter import BaseDatasetAdapter
from datasets.canonical.schemas import (
    CanonicalDatasetBundle,
    CanonicalEvidence,
    CanonicalEvidenceType,
    CanonicalEntity,
    CanonicalRelationship
)


class InLegalNERAdapter(BaseDatasetAdapter):
    """Adapter for InLegalNER and Indian legal judgements dataset."""

    def load_raw_data(self, source_path: str) -> Any:
        with open(source_path, "r", encoding="utf-8") as f:
            if source_path.endswith(".json"):
                return json.load(f)
            else:
                return f.read()

    def transform_to_canonical(self, raw_data: Any) -> CanonicalDatasetBundle:
        entities: List[CanonicalEntity] = []
        relationships: List[CanonicalRelationship] = []
        evidence_items: List[CanonicalEvidence] = []

        if isinstance(raw_data, list):
            # Process annotated spans from InLegalNER JSON
            for doc_idx, doc in enumerate(raw_data):
                doc_id = doc.get("id", f"InLegalNER_Doc_{doc_idx+1}")
                text = doc.get("text", "")
                evidence = CanonicalEvidence(
                    evidence_id=doc_id,
                    source_name=f"InLegalNER Court Case {doc_id}",
                    evidence_type=CanonicalEvidenceType.COURT_RECORD,
                    raw_content=text,
                    sha256_hash=self.compute_sha256(text),
                    metadata={"jurisdiction": "Supreme Court / High Court of India", "year": doc.get("year", 2024)}
                )
                evidence_items.append(evidence)

                doc_entities = []
                for ann in doc.get("annotations", []):
                    label = ann.get("label", "Unknown")
                    name = ann.get("name") or ann.get("text", "")
                    clean_name = name.strip()
                    if not clean_name:
                        continue

                    # Map InLegalNER labels to VEILLE canonical labels
                    veille_label = "Person"
                    if label in ["JUDGE", "PETITIONER", "RESPONDENT", "LAWYER", "WITNESS", "ACCUSED"]:
                        veille_label = "Person"
                    elif label in ["COURT", "ORG", "ORGANIZATION"]:
                        veille_label = "Organization"
                    elif label in ["GPE", "LOC", "LOCATION"]:
                        veille_label = "Location"
                    elif label in ["STATUTE", "PROVISION"]:
                        veille_label = "Statute"
                    elif label in ["EVENT"]:
                        veille_label = "Event"

                    slug = re.sub(r"[^a-zA-Z0-9_]", "_", clean_name)
                    ent_id = f"{veille_label}_{slug}"
                    ent = CanonicalEntity(
                        id=ent_id,
                        label=veille_label,
                        name=clean_name,
                        properties={"legal_role": label, "document_id": doc_id},
                        evidence_sources=[doc_id]
                    )
                    doc_entities.append(ent)
                    if not any(e.id == ent.id for e in entities):
                        entities.append(ent)

                # Link participants in case
                for i in range(len(doc_entities) - 1):
                    relationships.append(CanonicalRelationship(
                        source_id=doc_entities[i].id,
                        target_id=doc_entities[i+1].id,
                        type="PARTICIPATED_IN",
                        confidence=0.90,
                        properties={"context": "Same legal proceeding", "case_id": doc_id},
                        evidence_sources=[doc_id]
                    ))

        return CanonicalDatasetBundle(
            dataset_name="InLegalNER Legal Research Corpus",
            dataset_source="Indian Legal Documents Corpus (ILDC / InLegalNER)",
            classification="Real Research Corpus",
            description="Named entities and relationships extracted from Indian court judgements and statutory proceedings.",
            evidence_items=evidence_items,
            entities=entities,
            relationships=relationships
        )
