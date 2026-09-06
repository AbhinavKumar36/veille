"""
VEILLE — Production Pairwise Entity Resolution Empirical Evaluator
Directly invokes the production EntityResolver scoring pipeline across the 500+ pair benchmark suite,
computing complete confusion matrices, category breakdowns, and critical false-merge metrics.
"""

import os
import sys
from typing import Dict, List, Any
from collections import defaultdict

# Ensure root and backend directories are on sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.entity_resolution.resolver import EntityResolver, THRESHOLD_AUTO_MERGE, THRESHOLD_REVIEW
from ml.evaluation.er_benchmark_data import generate_comprehensive_er_benchmark, LabeledPair


def evaluate_entity_resolution(
    high_threshold: float = THRESHOLD_AUTO_MERGE,
    low_threshold: float = THRESHOLD_REVIEW
) -> Dict[str, Any]:
    """
    Evaluates the actual production EntityResolver engine against the comprehensive 500+ pair benchmark.
    Directly exercises production RapidFuzz lexical matching + structural Jaccard scoring.
    """
    resolver = EntityResolver()
    benchmark_pairs = generate_comprehensive_er_benchmark()

    tp = 0
    fp = 0
    tn = 0
    fn = 0
    hitl = 0

    category_stats = defaultdict(lambda: {"tp": 0, "fp": 0, "tn": 0, "fn": 0, "hitl": 0, "total": 0})
    details = []

    for pair in benchmark_pairs:
        # Pass directly into the production scoring path
        lex_score, struct_score, total_confidence = resolver.score(
            candidate_name=pair.mention_a,
            candidate_neighbours=pair.neighbours_a,
            db_name=pair.mention_b,
            db_neighbours=pair.neighbours_b
        )

        # Apply production decision logic
        if total_confidence >= high_threshold:
            decision = "AUTO_MERGE"
            if pair.is_same_entity:
                tp += 1
                outcome = "TP"
                category_stats[pair.category]["tp"] += 1
            else:
                fp += 1  # CATASTROPHIC FALSE MERGE
                outcome = "FP"
                category_stats[pair.category]["fp"] += 1
        elif total_confidence >= low_threshold:
            decision = "REVIEW_QUEUE"
            hitl += 1
            outcome = "HITL"
            category_stats[pair.category]["hitl"] += 1
        else:
            decision = "CREATE_NEW"
            if not pair.is_same_entity:
                tn += 1
                outcome = "TN"
                category_stats[pair.category]["tn"] += 1
            else:
                fn += 1  # FALSE SPLIT
                outcome = "FN"
                category_stats[pair.category]["fn"] += 1

        category_stats[pair.category]["total"] += 1

        details.append({
            "pair": f"'{pair.mention_a}' vs '{pair.mention_b}'",
            "type": pair.entity_type,
            "category": pair.category,
            "lexical_score": lex_score,
            "structural_score": struct_score,
            "total_confidence": total_confidence,
            "decision": decision,
            "ground_truth": "SAME" if pair.is_same_entity else "DIFFERENT",
            "outcome": outcome
        })

    total_pairs = len(benchmark_pairs)
    auto_decisions = tp + fp

    precision = (tp / (tp + fp)) * 100 if (tp + fp) > 0 else 100.0
    recall = (tp / (tp + fn)) * 100 if (tp + fn) > 0 else 100.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    false_merge_rate = (fp / (tp + fp)) * 100 if (tp + fp) > 0 else 0.0
    false_split_rate = (fn / (tp + fn)) * 100 if (tp + fn) > 0 else 0.0
    hitl_quarantine_rate = (hitl / total_pairs) * 100
    auto_merge_coverage = (auto_decisions / total_pairs) * 100

    # Calculate per-category breakdown
    category_breakdown = {}
    for cat, s in category_stats.items():
        cat_p = (s["tp"] / (s["tp"] + s["fp"])) * 100 if (s["tp"] + s["fp"]) > 0 else 100.0
        cat_r = (s["tp"] / (s["tp"] + s["fn"])) * 100 if (s["tp"] + s["fn"]) > 0 else 100.0
        category_breakdown[cat] = {
            "total": s["total"],
            "tp": s["tp"],
            "fp": s["fp"],
            "tn": s["tn"],
            "fn": s["fn"],
            "hitl": s["hitl"],
            "precision": round(cat_p, 2),
            "recall": round(cat_r, 2)
        }

    return {
        "total_pairs_evaluated": total_pairs,
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "hitl_quarantined": hitl,
        "auto_merge_precision": round(precision, 2),
        "auto_merge_recall": round(recall, 2),
        "auto_merge_f1": round(f1, 2),
        "false_merge_rate": round(false_merge_rate, 2),
        "false_split_rate": round(false_split_rate, 2),
        "hitl_quarantine_rate": round(hitl_quarantine_rate, 2),
        "auto_merge_coverage": round(auto_merge_coverage, 2),
        "category_breakdown": category_breakdown,
        "details_sample": details[:10]
    }


if __name__ == "__main__":
    res = evaluate_entity_resolution()
    print("=" * 80)
    print(" VEILLE PRODUCTION ENTITY RESOLVER — 500+ PAIR EMPIRICAL EVALUATION")
    print("=" * 80)
    print(f"Total Labeled Pairs Evaluated : {res['total_pairs_evaluated']}")
    print(f"True Positives (Correct Merge): {res['true_positives']}")
    print(f"False Positives (False Merge) : {res['false_positives']}")
    print(f"True Negatives (Correct Split): {res['true_negatives']}")
    print(f"False Negatives (False Split) : {res['false_negatives']}")
    print(f"HITL Quarantined Pairs        : {res['hitl_quarantined']}")
    print("-" * 80)
    print(f"Production Auto-Merge Precision : {res['auto_merge_precision']}%")
    print(f"Production Auto-Merge Recall    : {res['auto_merge_recall']}%")
    print(f"Production Auto-Merge F1-Score  : {res['auto_merge_f1']}%")
    print(f"Empirical False Merge Rate      : {res['false_merge_rate']}%")
    print(f"False Split Rate                : {res['false_split_rate']}%")
    print(f"HITL Review / Quarantine Rate   : {res['hitl_quarantine_rate']}%")
    print(f"Auto-Merge Coverage             : {res['auto_merge_coverage']}%")
    print("=" * 80)
    print("\nPER-CATEGORY PERFORMANCE BREAKDOWN:")
    print(f"{'Category':<30} | {'Total':<6} | {'TP':<4} | {'FP':<4} | {'TN':<4} | {'FN':<4} | {'HITL':<5} | {'Prec (%)':<8}")
    print("-" * 80)
    for cat, cb in res["category_breakdown"].items():
        print(f"{cat:<30} | {cb['total']:<6} | {cb['tp']:<4} | {cb['fp']:<4} | {cb['tn']:<4} | {cb['fn']:<4} | {cb['hitl']:<5} | {cb['precision']:<8.1f}")
    print("=" * 80)
