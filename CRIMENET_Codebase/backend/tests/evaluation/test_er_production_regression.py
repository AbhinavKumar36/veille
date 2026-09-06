"""
VEILLE — Entity Resolution Production Regression Test Suite
Guarantees:
  1. False Merge Rate remains strictly 0.0% on critical collision pairs (protects citizens).
  2. Auto-Merge Precision >= 95.0% on valid aliases and formatting variations.
  3. High (0.85) and Low (0.50) decision zone threshold invariants.
"""

import pytest
import os
import sys

# Ensure root and backend directories are on sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.entity_resolution.resolver import EntityResolver, THRESHOLD_AUTO_MERGE, THRESHOLD_REVIEW
from ml.evaluation.er_benchmark_data import generate_comprehensive_er_benchmark
from ml.evaluation.er_eval import evaluate_entity_resolution


def test_er_threshold_invariants():
    """Verify production thresholds match architectural specification."""
    assert THRESHOLD_AUTO_MERGE == 0.85
    assert THRESHOLD_REVIEW == 0.50


def test_zero_false_merges_on_critical_collisions():
    """Guarantees that distinct individuals with common first/last names or off-by-one numbers NEVER auto-merge."""
    resolver = EntityResolver()
    benchmark_pairs = generate_comprehensive_er_benchmark()
    
    collision_pairs = [p for p in benchmark_pairs if not p.is_same_entity]
    assert len(collision_pairs) >= 150, "Benchmark must contain at least 150 negative test pairs."

    false_merges = []
    for pair in collision_pairs:
        lex, struct, total = resolver.score(
            pair.mention_a, pair.neighbours_a,
            pair.mention_b, pair.neighbours_b
        )
        if total >= THRESHOLD_AUTO_MERGE:
            false_merges.append((pair.mention_a, pair.mention_b, total, pair.category))

    assert len(false_merges) == 0, f"Critical Regression: Observed {len(false_merges)} false merges: {false_merges}"


def test_auto_merge_precision_benchmark():
    """Validates that production resolver achieves >= 95% precision across full benchmark."""
    res = evaluate_entity_resolution()
    assert res["auto_merge_precision"] >= 95.0
    assert res["false_merge_rate"] == 0.0
    assert res["hitl_quarantined"] > 0, "Review queue must actively catch ambiguous borderline collisions."
