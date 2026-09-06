"""
VEILLE — External Dataset Ingestion & Standardization Runner
Executes canonical adapters across both local unit fixtures and raw multi-source corpora.
"""

import json
import os
import sys

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datasets.adapters.inlegalner_adapter import InLegalNERAdapter
from datasets.adapters.icij_adapter import ICIJOffshoreAdapter
from datasets.adapters.enron_adapter import EnronEmailAdapter
from datasets.adapters.aml_adapter import AMLTransactionAdapter


def run_all_adapters(mode: str = "fixtures"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    external_dir = os.path.join(base_dir, "external")

    subfolder = "fixtures" if mode == "fixtures" else "raw"
    title_suffix = "UNIT FIXTURE VALIDATION" if mode == "fixtures" else "RAW CORPUS STANDARDIZATION"

    print("=" * 80)
    print(f" VEILLE DATASET ADAPTER LAYER — {title_suffix}")
    print("=" * 80)

    if mode == "fixtures":
        adapters = [
            ("InLegalNER Legal Fixture", InLegalNERAdapter(), os.path.join(external_dir, "inlegalner", "fixtures", "sample_judgements.json")),
            ("ICIJ Offshore Leaks Fixture", ICIJOffshoreAdapter(), os.path.join(external_dir, "icij", "fixtures", "sample_offshore_nodes.csv")),
            ("Enron Email Fixture", EnronEmailAdapter(), os.path.join(external_dir, "enron", "fixtures", "sample_emails.json")),
            ("IBM AML Transaction Fixture", AMLTransactionAdapter(), os.path.join(external_dir, "ibm_aml", "fixtures", "sample_transactions.csv")),
        ]
    else:
        adapters = [
            ("InLegalNER Research Corpus", InLegalNERAdapter(), os.path.join(external_dir, "inlegalner", "raw", "inlegalner_corpus.json")),
            ("ICIJ Panama/Pandora Registry Slice", ICIJOffshoreAdapter(), os.path.join(external_dir, "icij", "raw", "icij_panama_pandora_slice.csv")),
            ("Enron Corporate Email Corpus", EnronEmailAdapter(), os.path.join(external_dir, "enron", "raw", "enron_corporate_emails.json")),
            ("IBM AML Layering Transaction Matrix", AMLTransactionAdapter(), os.path.join(external_dir, "ibm_aml", "raw", "aml_synthetic_matrix.csv")),
        ]

    total_evidence = 0
    total_entities = 0
    total_relationships = 0

    results = []

    for name, adapter, path in adapters:
        if not os.path.exists(path):
            print(f"[!] Warning: Path '{path}' does not exist.")
            continue

        raw = adapter.load_raw_data(path)
        bundle = adapter.transform_to_canonical(raw)
        adapter.validate_bundle(bundle)

        total_evidence += len(bundle.evidence_items)
        total_entities += len(bundle.entities)
        total_relationships += len(bundle.relationships)

        results.append({
            "name": name,
            "classification": bundle.classification,
            "evidence_count": len(bundle.evidence_items),
            "entities_count": len(bundle.entities),
            "relationships_count": len(bundle.relationships),
        })

        print(f"\n[+] Successfully Adapted: {name}")
        print(f"    • Source Classification: {bundle.classification}")
        print(f"    • Canonical Evidence Items: {len(bundle.evidence_items)}")
        print(f"    • Canonical Entities: {len(bundle.entities)}")
        print(f"    • Canonical Relationships: {len(bundle.relationships)}")

    print("\n" + "=" * 80)
    print(f" ADAPTATION SUMMARY TABLE ({mode.upper()})")
    print("=" * 80)
    print(f"{'Dataset Source':<38} | {'Classification':<22} | {'Entities':<10} | {'Edges':<8}")
    print("-" * 80)
    for r in results:
        print(f"{r['name']:<38} | {r['classification']:<22} | {r['entities_count']:<10} | {r['relationships_count']:<8}")
    print("-" * 80)
    print(f"{'TOTAL STANDARDIZED CANONICAL GRAPH':<38} | {'Multi-Modal Corpus':<22} | {total_entities:<10} | {total_relationships:<8}")
    print("=" * 80)

    return results


if __name__ == "__main__":
    mode_arg = sys.argv[1] if len(sys.argv) > 1 else "fixtures"
    run_all_adapters(mode_arg)
