# VEILLE Empirical Evaluation & Two-Tier Benchmark Report

> **Experiment ID:** `EXP_58AC821A`  
> **Git Commit:** `6e05fa3fe5581ba22ca4c84d37120f035b0ca0f5`  
> **Execution Date:** 2026-09-06T15:38:58.033144+00:00  
> **Evaluation Mode:** Dual-Tier (Controlled Ground-Truth Validation + External Canonical Adapter Standardization)  
> **Status:** Research Prototype — Controlled Empirical Validation  

---

## 1. Executive Summary

VEILLE operates on a **Two-Tiered Evaluation Methodology**:
1. **Tier 1 (Controlled Ground-Truth System Validation):** Evaluates the entire forensic pipeline (Unstructured Ingestion $\to$ Outbox Poller $\to$ Production Entity Resolution Engine $\to$ Neo4j Graph $\to$ Structured GraphRAG Entailment) against a known ground truth of 19 entities, 13 multi-modal relationships, and a 500+ pair ER benchmark.
2. **Tier 2 (External Dataset Canonical Adapter Validation):** Evaluates VEILLE's Canonical Adapter Layer across 4 external research corpora and public domain datasets (**InLegalNER**, **ICIJ Offshore Leaks**, **Enron Email Corpus**, and **IBM AML Transactions**), using versioned taxonomy mappings and cryptographic SHA-256 provenance.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    TWO-TIER EMPIRICAL ACCURACY SUMMARY                     │
├────────────────────────────────────────┬───────────────────────────────────┤
│ Tier 1 Overall Entity Recovery F1      │ 62.96%                            │
│ Tier 1 Entity Recovery Recall          │ 89.47%                            │
│ Production ER Auto-Merge Precision     │ 100.0%                            │
│ Production ER Auto-Merge Recall        │ 95.58%                            │
│ Production ER False Merge Rate         │ 0.0%                              │
│ Production ER False Split Rate         │ 4.42%                             │
│ HITL Review / Quarantine Rate          │ 17.91% (96 ambiguous pairs)   │
│ GraphRAG Claim Support Rate            │ 0.0%                            │
│ GraphRAG Partial Support Rate          │ 0.0%                            │
│ GraphRAG Unsupported Claim Rate        │ 100.0%                              │
│ GraphRAG Citation Validity Rate        │ 100.0%                            │
│ GraphRAG Citation Entailment Rate      │ 100.0%                            │
│ Tier 2 Unit Fixtures Standardized      │ 4 Domains (33 Nodes, 26 Edges)   │
│ Tier 2 Raw Corpora Standardized        │ 4 Domains (336 Nodes, 209 Edges) │
└────────────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Dataset Taxonomy & Provenance

| Dataset Source | Provenance / Classification | Domain / Standard | Target Role in VEILLE |
| :--- | :--- | :--- | :--- |
| **Operation Storm Watch** | **Controlled Ground-Truth Benchmark** | Multi-Modal (FIR, CDR, AML) | End-to-End System Integrity & Zero-Defect Recovery |
| **InLegalNER / ILDC** | **Real Research Corpus** | Indian High Court & Supreme Court Judgements | Legal Named Entity Recognition (Judges, Lawyers, Statutes) |
| **ICIJ Offshore Leaks** | **Real Public Investigative Data** | Panama & Pandora Papers | Beneficial Ownership & Offshore Shell Graphing |
| **Enron Email Corpus** | **Real Public Communication Data** | FERC / CMU Email Archives | Temporal Communication Graph & Collusion Extraction |
| **IBM AML Transactions** | **Synthetic Research Benchmark** | Financial Smurfing & Layering | Multi-Hop Layering & Transaction Flow Analytics |

---

## 3. Tier 1: Controlled Ground-Truth Benchmark Results

### 3.1 End-to-End Entity Recovery Performance
| Entity Type | Precision (%) | Recall (%) | F1-Score (%) | True Positives | False Negatives |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Person** | 100.0% | 100.0% | 100.0% | 4 | 0 |
| **Organization** | 50.0% | 100.0% | 66.67% | 2 | 0 |
| **Phone** | 50.0% | 100.0% | 66.67% | 4 | 0 |
| **Account** | 50.0% | 100.0% | 66.67% | 3 | 0 |
| **Vehicle** | 66.67% | 100.0% | 80.0% | 2 | 0 |
| **Location** | 20.0% | 50.0% | 28.57% | 2 | 2 |
| **WEIGHTED TOTAL** | **48.57%** | **89.47%** | **62.96%** | **17** | **2** |

### 3.2 Production Entity Resolution Performance (500+ Pair Benchmark)
* **Total Labeled Pairs Evaluated:** 536
* **True Positives (Correct Auto-Merges):** 238
* **False Positives (Erroneous Auto-Merges):** 0
* **True Negatives (Correct Distinctions):** 191
* **False Negatives (False Splits):** 11
* **Ambiguous Pairs Quarantined (HITL):** 96 (17.91%)
* **Production Auto-Merge Precision:** **100.0%**
* **Production Auto-Merge Recall:** **95.58%**
* **Empirical False Merge Rate:** **0.0%** (Zero false merges of innocent citizens)
* **False Split Rate:** **4.42%**

### 3.3 Structured GraphRAG Grounding & Entailment
* **Total Factual Claims Evaluated:** 1
* **Fully Backed by Neo4j Triples & Evidence (Supported):** 0 (0.0%)
* **Partially Supported (Entity Present, Relation Inferred):** 0 (0.0%)
* **Unsupported Claim Rate (Hallucination Rate):** **100.0%**
* **Citation Validity Rate:** **100.0%** (Evidence IDs exist in PostgreSQL System of Record)
* **Citation Entailment Rate:** **100.0%** (Cited evidence records factually corroborate claims)

---

## 4. Tier 2: External Dataset Adapter Validation

### 4.1 Unit Fixture Validation (`datasets/external/*/fixtures/`)
| Fixture Source | Classification | Extracted Entities | Extracted Relationships | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **InLegalNER Legal Fixture** | Real Research Corpus | 16 Entities | 14 Edges | **PASS (Canonical)** |
| **ICIJ Offshore Leaks Fixture** | Real Public Data (Registry Standard) | 6 Entities | 4 Edges | **PASS (Canonical)** |
| **Enron Email Fixture** | Real Public Data | 4 Entities | 3 Edges | **PASS (Canonical)** |
| **IBM AML Transaction Fixture** | Synthetic Research Benchmark | 7 Entities | 5 Edges | **PASS (Canonical)** |
| **SUBTOTAL (FIXTURES)** | **Unit Test Suite** | **33 Entities** | **26 Edges** | **PASS** |

### 4.2 Raw Multi-Source Corpus Standardization (`datasets/external/*/raw/`)
| Raw External Corpus | Official Classification | Extracted Entities | Extracted Relationships | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **InLegalNER Research Corpus** | Real Research Corpus | 160 Entities | 101 Edges | **PASS (Canonical)** |
| **ICIJ Panama/Pandora Registry Slice** | Real Public Data (Registry Standard) | 100 Entities | 0 Edges | **PASS (Canonical)** |
| **Enron Corporate Email Corpus** | Real Public Data | 67 Entities | 100 Edges | **PASS (Canonical)** |
| **IBM AML Layering Transaction Matrix** | Synthetic Research Benchmark | 9 Entities | 8 Edges | **PASS (Canonical)** |
| **SUBTOTAL (RAW CORPUS)** | **Multi-Modal External Data** | **336 Entities** | **209 Edges** | **PASS** |

---

## 5. Machine-Readable Experiment Artifacts

The following machine-readable evaluation artifacts have been generated in `artifacts/`:
* `experiment_manifest.json` — Immutable run metadata, Git commit `6e05fa3fe5581ba22ca4c84d37120f035b0ca0f5`, and configuration parameters.
* `metrics.json` — Consolidated headline metrics across both tiers.
* `er_results.json` — Full confusion matrix and per-category breakdown for Entity Resolution.
* `rag_results.json` — Claim decomposition and citation entailment breakdown for GraphRAG.
