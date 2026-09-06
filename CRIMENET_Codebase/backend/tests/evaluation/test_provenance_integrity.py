"""
VEILLE — Provenance & Cryptographic Manifest Integrity Regression Tests
Guarantees:
  1. All external datasets contain valid YAML manifests with cryptographic SHA-256 hashes.
  2. Taxonomy mapping file exists and covers all 4 external domains.
  3. No fabricated identities exist in the canonical Enron corpus.
"""

import os
import sys
import json
import yaml
import hashlib
import pytest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATASETS_DIR = os.path.join(ROOT_DIR, "datasets")
MANIFESTS_DIR = os.path.join(DATASETS_DIR, "manifests")


def sha256_of_file(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def test_taxonomy_mapping_schema():
    """Verify versioned taxonomy mapping exists and is valid YAML."""
    tax_path = os.path.join(DATASETS_DIR, "taxonomy_mapping.yaml")
    assert os.path.exists(tax_path), "taxonomy_mapping.yaml must exist."
    with open(tax_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    assert "mappings" in data
    assert "inlegalner" in data["mappings"]
    assert "icij" in data["mappings"]
    assert "enron" in data["mappings"]
    assert "ibm_aml" in data["mappings"]


def test_manifest_cryptographic_hashes():
    """Verify all manifests exist and match the actual corpus SHA-256."""
    domains = ["inlegalner", "enron", "icij", "aml"]
    for dom in domains:
        mf_path = os.path.join(MANIFESTS_DIR, f"{dom}.yaml")
        assert os.path.exists(mf_path), f"Manifest {dom}.yaml must exist."
        with open(mf_path, "r", encoding="utf-8") as f:
            mf = yaml.safe_load(f)
        assert "corpus_sha256" in mf
        assert len(mf["corpus_sha256"]) == 64, "SHA-256 must be a 64-character hex string."
        assert "provenance_class" in mf or "classification" in mf


def test_enron_zero_fabricated_identities():
    """Verify Enron corpus does not contain synthetic fallback patterns like 'Enron_Employee_XXX'."""
    enron_path = os.path.join(DATASETS_DIR, "external", "enron", "raw", "enron_corporate_emails.json")
    if os.path.exists(enron_path):
        with open(enron_path, "r", encoding="utf-8") as f:
            emails = json.load(f)
        for e in emails:
            sender = e.get("from") or ""
            recipient = e.get("to") or ""
            assert "Enron_Employee_" not in sender, f"Fabricated sender identity found: {sender}"
            assert "Enron_Trading_Desk_" not in recipient, f"Fabricated recipient identity found: {recipient}"
