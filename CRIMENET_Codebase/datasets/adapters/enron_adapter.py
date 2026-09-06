"""
VEILLE — Enron Email Corpus Adapter
Transforms real public email corpora (Enron Email Corpus / Carnegie Mellon) into
communication graphs, temporal interactions, and NLP intelligence artifacts.
"""

import json
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


class EnronEmailAdapter(BaseDatasetAdapter):
    """Adapter for Enron Email Corpus."""

    def load_raw_data(self, source_path: str) -> Any:
        with open(source_path, "r", encoding="utf-8") as f:
            if source_path.endswith(".json"):
                return json.load(f)
            return [line.strip() for line in f if line.strip()]

    def transform_to_canonical(self, raw_data: Any) -> CanonicalDatasetBundle:
        entities: List[CanonicalEntity] = []
        relationships: List[CanonicalRelationship] = []
        evidence_items: List[CanonicalEvidence] = []

        if isinstance(raw_data, list):
            for idx, msg in enumerate(raw_data):
                msg_id = msg.get("id") or f"Enron_Msg_{idx+1}"
                sender = msg.get("from") or msg.get("sender", "unknown@enron.com")
                recipients = msg.get("to") or msg.get("recipients", [])
                if isinstance(recipients, str):
                    recipients = [r.strip() for r in recipients.split(",") if r.strip()]
                date_str = msg.get("date") or msg.get("timestamp", "2001-10-15T09:00:00")
                subject = msg.get("subject", "")
                body = msg.get("body", "")

                # Record evidence item
                evidence = CanonicalEvidence(
                    evidence_id=msg_id,
                    source_name=f"Enron Email {msg_id}",
                    evidence_type=CanonicalEvidenceType.EMAIL,
                    raw_content=f"Subject: {subject}\nFrom: {sender}\nTo: {', '.join(recipients)}\n\n{body}",
                    sha256_hash=self.compute_sha256(body),
                    metadata={"subject": subject, "timestamp": date_str}
                )
                evidence_items.append(evidence)

                # Sender entity
                sender_name = sender.split("@")[0].replace(".", " ").title()
                sender_id = f"Person_{re.sub(r'[^a-zA-Z0-9_]', '_', sender_name)}"
                sender_ent = CanonicalEntity(
                    id=sender_id,
                    label="Person",
                    name=sender_name,
                    properties={"email": sender, "organization": "Enron Corp"},
                    evidence_sources=[msg_id]
                )
                if not any(e.id == sender_ent.id for e in entities):
                    entities.append(sender_ent)

                # Recipient entities and communication edges
                for rec in recipients:
                    rec_name = rec.split("@")[0].replace(".", " ").title()
                    rec_id = f"Person_{re.sub(r'[^a-zA-Z0-9_]', '_', rec_name)}"
                    rec_ent = CanonicalEntity(
                        id=rec_id,
                        label="Person",
                        name=rec_name,
                        properties={"email": rec, "organization": "Enron Corp"},
                        evidence_sources=[msg_id]
                    )
                    if not any(e.id == rec_ent.id for e in entities):
                        entities.append(rec_ent)

                    # Relationship
                    relationships.append(CanonicalRelationship(
                        source_id=sender_id,
                        target_id=rec_id,
                        type="COMMUNICATES_WITH",
                        confidence=0.98,
                        properties={"channel": "Email", "timestamp": date_str, "subject": subject},
                        evidence_sources=[msg_id]
                    ))

        return CanonicalDatasetBundle(
            dataset_name="Enron Email Corpus",
            dataset_source="Federal Energy Regulatory Commission (FERC) / Carnegie Mellon",
            classification="Real Public Data",
            description="Real corporate email communications used for NLP extraction, social network analysis, and insider collusion detection.",
            evidence_items=evidence_items,
            entities=entities,
            relationships=relationships
        )
