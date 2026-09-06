"""
VEILLE — ICIJ Offshore Leaks Dataset Adapter
Transforms real investigative data from ICIJ (Panama Papers, Pandora Papers, Paradise Papers)
into VEILLE canonical corporate graph entities and beneficial ownership edges.
Employs a two-pass node registry to resolve exact node identities and relationship endpoints.
"""

import csv
import io
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


class ICIJOffshoreAdapter(BaseDatasetAdapter):
    """Adapter for ICIJ Offshore Leaks entity and relationship datasets."""

    def load_raw_data(self, source_path: str) -> Any:
        with open(source_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def transform_to_canonical(self, raw_data: Any) -> CanonicalDatasetBundle:
        entities: List[CanonicalEntity] = []
        relationships: List[CanonicalRelationship] = []
        evidence_items: List[CanonicalEvidence] = []

        doc_id = "ICIJ_Offshore_Leaks_Registry"
        evidence_items.append(CanonicalEvidence(
            evidence_id=doc_id,
            source_name="International Consortium of Investigative Journalists (ICIJ)",
            evidence_type=CanonicalEvidenceType.CORPORATE_REGISTRY,
            raw_content=f"ICIJ Offshore Leaks Registry Export containing {len(raw_data)} records.",
            sha256_hash=self.compute_sha256(str(raw_data[:10]) if raw_data else "EMPTY"),
            metadata={"investigation": "Panama Papers / Pandora Papers", "domain": "Offshore Shell Entities"}
        ))

        # ── PASS 1: CONSTRUCT COMPLETE NODE REGISTRY ─────────────────────────────
        # node_id -> CanonicalEntity
        node_registry: Dict[str, CanonicalEntity] = {}

        for row in raw_data:
            node_id = str(row.get("node_id") or row.get("id") or "").strip()
            name = str(row.get("name") or row.get("officer_name") or "").strip()
            raw_type = (row.get("entity_type") or row.get("type") or "Entity").title()
            jurisdiction = row.get("jurisdiction", "Offshore")
            country = row.get("country_codes", "")

            if not node_id and not name:
                continue

            veille_label = "Organization"
            if "Officer" in raw_type or "Person" in raw_type or "Beneficiary" in raw_type:
                veille_label = "Person"
            elif "Address" in raw_type or "Location" in raw_type:
                veille_label = "Location"
            elif "Intermediary" in raw_type:
                veille_label = "Organization"

            slug = re.sub(r"[^a-zA-Z0-9_]", "_", name or node_id)
            ent_id = f"{veille_label}_{node_id or slug}"

            if node_id and node_id not in node_registry:
                ent = CanonicalEntity(
                    id=ent_id,
                    label=veille_label,
                    name=name or f"Unknown {veille_label} {node_id}",
                    properties={
                        "node_id": node_id,
                        "raw_type": raw_type,
                        "jurisdiction": jurisdiction,
                        "country": country,
                        "source_investigation": "ICIJ Offshore Leaks"
                    },
                    evidence_sources=[doc_id]
                )
                node_registry[node_id] = ent
                entities.append(ent)
            elif not node_id:
                # Fallback by name slug
                ent = CanonicalEntity(
                    id=ent_id,
                    label=veille_label,
                    name=name,
                    properties={
                        "raw_type": raw_type,
                        "jurisdiction": jurisdiction,
                        "country": country,
                        "source_investigation": "ICIJ Offshore Leaks"
                    },
                    evidence_sources=[doc_id]
                )
                if not any(e.id == ent.id for e in entities):
                    entities.append(ent)

        # ── PASS 2: RESOLVE RELATIONSHIPS VIA NODE REGISTRY ───────────────────────
        for row in raw_data:
            source_id = str(row.get("node_id") or row.get("id") or "").strip()
            target_id = str(row.get("target_node_id") or row.get("connected_to") or "").strip()
            link_type = row.get("link_type") or row.get("relationship", "ASSOCIATED_WITH")
            jurisdiction = row.get("jurisdiction", "Offshore")

            if not source_id or not target_id:
                continue

            # Lookup source and target in node registry
            source_ent = node_registry.get(source_id)
            target_ent = node_registry.get(target_id)

            if source_ent and target_ent:
                # Normalize link types
                clean_link = "ASSOCIATED_WITH"
                if any(k in link_type.lower() for k in ["owner", "shareholder", "director", "beneficiary", "owns"]):
                    clean_link = "OWNS"
                elif any(k in link_type.lower() for k in ["location", "registered_at", "address"]):
                    clean_link = "LOCATED_AT"
                elif any(k in link_type.lower() for k in ["intermediary", "service_provider"]):
                    clean_link = "ASSOCIATED_WITH"

                relationships.append(CanonicalRelationship(
                    source_id=source_ent.id,
                    target_id=target_ent.id,
                    type=clean_link,
                    confidence=0.95,
                    properties={
                        "relationship_description": link_type,
                        "jurisdiction": jurisdiction
                    },
                    evidence_sources=[doc_id]
                ))

        return CanonicalDatasetBundle(
            dataset_name="ICIJ Offshore Leaks Database",
            dataset_source="International Consortium of Investigative Journalists (ICIJ)",
            classification="Real Public Data (Registry Standard)",
            description="Corporate ownership, intermediaries, and offshore shell companies across international financial havens.",
            evidence_items=evidence_items,
            entities=entities,
            relationships=relationships
        )
