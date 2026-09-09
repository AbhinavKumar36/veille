"""
VEILLE — IBM AML Financial Transaction Adapter
Transforms AML transaction records (IBM Transactions for Anti-Money Laundering benchmark)
into accounts, transactions, and layering graph topology.
"""

import csv
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


class AMLTransactionAdapter(BaseDatasetAdapter):
    """Adapter for IBM AML / Financial Transaction benchmarks."""

    def load_raw_data(self, source_path: str) -> Any:
        with open(source_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def transform_to_canonical(self, raw_data: Any) -> CanonicalDatasetBundle:
        entities: List[CanonicalEntity] = []
        relationships: List[CanonicalRelationship] = []
        evidence_items: List[CanonicalEvidence] = []

        doc_id = "AML_Financial_Ledger"
        evidence_items.append(CanonicalEvidence(
            evidence_id=doc_id,
            source_name="IBM Anti-Money Laundering Benchmark",
            evidence_type=CanonicalEvidenceType.FINANCIAL,
            raw_content=f"AML Transaction Ledger containing {len(raw_data)} banking records.",
            sha256_hash=self.compute_sha256(str(raw_data[:10])),
            metadata={"domain": "Financial Crime", "benchmark": "IBM AML Synthetic Benchmark"}
        ))

        for row in raw_data:
            sender_acc = row.get("sender_account") or row.get("from_acc") or row.get("Source_Account") or ""
            receiver_acc = row.get("receiver_account") or row.get("to_acc") or row.get("Target_Account") or ""
            amount = float(row.get("amount") or row.get("Amount") or 0.0)
            currency = row.get("currency") or row.get("Currency") or "USD"
            timestamp = row.get("timestamp") or row.get("Date") or ""
            tx_type = row.get("type") or row.get("Payment_Type") or "WIRE"
            is_laundering = row.get("is_laundering") or row.get("Is_Laundering") or "0"

            if sender_acc:
                s_id = f"Account_{re.sub(r'[^a-zA-Z0-9_]', '_', sender_acc.strip())}"
                s_ent = CanonicalEntity(
                    id=s_id,
                    label="Account",
                    name=sender_acc.strip(),
                    properties={"currency": currency, "account_type": "Checking / Business"},
                    evidence_sources=[doc_id]
                )
                if not any(e.id == s_ent.id for e in entities):
                    entities.append(s_ent)

            if receiver_acc:
                r_id = f"Account_{re.sub(r'[^a-zA-Z0-9_]', '_', receiver_acc.strip())}"
                r_ent = CanonicalEntity(
                    id=r_id,
                    label="Account",
                    name=receiver_acc.strip(),
                    properties={"currency": currency, "account_type": "Checking / Business"},
                    evidence_sources=[doc_id]
                )
                if not any(e.id == r_ent.id for e in entities):
                    entities.append(r_ent)

            if sender_acc and receiver_acc:
                s_id = f"Account_{re.sub(r'[^a-zA-Z0-9_]', '_', sender_acc.strip())}"
                r_id = f"Account_{re.sub(r'[^a-zA-Z0-9_]', '_', receiver_acc.strip())}"
                relationships.append(CanonicalRelationship(
                    source_id=s_id,
                    target_id=r_id,
                    type="TRANSFERRED_FUNDS",
                    confidence=1.0,
                    properties={
                        "amount": amount,
                        "currency": currency,
                        "timestamp": timestamp,
                        "payment_type": tx_type,
                        "suspicious_flag": is_laundering in ["1", "True", "true", "SUSPICIOUS"]
                    },
                    evidence_sources=[doc_id]
                ))

        return CanonicalDatasetBundle(
            dataset_name="IBM AML Transaction Benchmark",
            dataset_source="IBM Research Anti-Money Laundering Synthetic Data",
            classification="Synthetic Research Benchmark",
            description="Multi-hop financial layering and smurfing transaction graphs used to evaluate AML graph analytics.",
            evidence_items=evidence_items,
            entities=entities,
            relationships=relationships
        )
