"""
VEILLE — Exact-Span Named Entity Recognition (NER) Empirical Evaluator
Evaluates NLP extraction at standard character and token span offsets,
computing exact-span Precision, Recall, and F1 per entity category alongside end-to-end recovery diagnostics.
"""

from typing import Dict, List, Any, Tuple
from dataclasses import dataclass


@dataclass
class GoldSpan:
    text: str
    start_char: int
    end_char: int
    label: str


@dataclass
class PredSpan:
    text: str
    start_char: int
    end_char: int
    label: str


def evaluate_exact_spans(
    gold_spans: List[GoldSpan],
    pred_spans: List[PredSpan],
    allowed_tolerance_chars: int = 0
) -> Dict[str, Any]:
    """
    Computes strict exact-span match metrics (start, end, label).
    """
    labels = sorted(list(set([g.label for g in gold_spans] + [p.label for p in pred_spans])))
    per_label = {}
    
    total_tp = 0
    total_fp = 0
    total_fn = 0

    for lbl in labels:
        g_lbl = [g for g in gold_spans if g.label.lower() == lbl.lower()]
        p_lbl = [p for p in pred_spans if p.label.lower() == lbl.lower()]
        
        tp = 0
        matched_preds = set()
        
        for g in g_lbl:
            # Check for exact span match
            for i, p in enumerate(p_lbl):
                if i in matched_preds:
                    continue
                if abs(g.start_char - p.start_char) <= allowed_tolerance_chars and abs(g.end_char - p.end_char) <= allowed_tolerance_chars:
                    tp += 1
                    matched_preds.add(i)
                    break
                    
        fp = len(p_lbl) - tp
        fn = len(g_lbl) - tp
        
        prec = (tp / (tp + fp)) * 100 if (tp + fp) > 0 else 100.0
        rec = (tp / (tp + fn)) * 100 if (tp + fn) > 0 else 100.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        per_label[lbl] = {
            "gold_count": len(g_lbl),
            "pred_count": len(p_lbl),
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "precision": round(prec, 2),
            "recall": round(rec, 2),
            "f1": round(f1, 2)
        }
        
        total_tp += tp
        total_fp += fp
        total_fn += fn

    overall_p = (total_tp / (total_tp + total_fp)) * 100 if (total_tp + total_fp) > 0 else 100.0
    overall_r = (total_tp / (total_tp + total_fn)) * 100 if (total_tp + total_fn) > 0 else 100.0
    overall_f1 = (2 * overall_p * overall_r) / (overall_p + overall_r) if (overall_p + overall_r) > 0 else 0.0

    return {
        "exact_span_precision": round(overall_p, 2),
        "exact_span_recall": round(overall_r, 2),
        "exact_span_f1": round(overall_f1, 2),
        "total_gold_spans": len(gold_spans),
        "total_pred_spans": len(pred_spans),
        "total_tp": total_tp,
        "total_fp": total_fp,
        "total_fn": total_fn,
        "per_label_metrics": per_label
    }
