# VEILLE Empirical Evaluation & Two-Tier Benchmark Report

> **Evaluation Date:** September 2026  
> **Evaluation Mode:** Dual-Tier (Controlled System Validation + External Dataset Adapter Validation)  
> **Target Cases:** Operation Storm Watch (Controlled Ground Truth) & External Public Domain Corpora  
> **Status:** Academic & SIH Jury-Ready Forensic Evaluation  

---

## 1. Executive Summary

VEILLE employs a **Two-Tiered Evaluation Methodology**:
1. **Tier 1 (Controlled Ground-Truth System Validation):** Evaluates the entire forensic pipeline (Unstructured Ingestion $\to$ NLP $\to$ Entity Resolution $\to$ Neo4j Graph $\to$ GraphRAG) against an exact, known ground truth of 19 entities and 13 multi-modal relationships.
2. **Tier 2 (External Dataset Adapter Validation):** Evaluates VEILLE's Canonical Adapter Layer across 4 external research corpora and public domain datasets (**InLegalNER**, **ICIJ Offshore Leaks**, **Enron Email Corpus**, and **IBM AML Transactions**), using both unit fixtures and raw multi-source samples.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    TWO-TIER EMPIRICAL ACCURACY SUMMARY                     │
├────────────────────────────────────────┬───────────────────────────────────┤
│ Tier 1 Overall Entity Recovery F1      │ 62.96%                            │
│ Tier 1 Entity Recovery Recall          │ 89.47%                            │
│ False Merge Rate (among auto-merges)   │ 0.0%                              │
│ HITL Review / Quarantine Rate          │ 22.22% (10 ambiguous pairs quarantined)   │
│ GraphRAG Entity Mention Coverage       │ 100.0%                            │
│ GraphRAG Knowledge Graph Grounding     │ 100.0%                            │
│ GraphRAG Evidence Citation Score       │ 100.0%                            │
│ Tier 2 Unit Fixtures Standardized      │ 4 Domains (33 Nodes, 26 Edges)   │
│ Tier 2 Raw Corpora Standardized        │ 4 Domains (52 Nodes, 44 Edges)   │
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

### 3.2 Entity Resolution & Safeguards Formulation
* **Total Collision Candidates Detected:** 45
* **Auto-Merged Entity Pairs:** 16 (Coverage: 35.56%)
* **False Merges Observed in Auto-Merges:** 0 (False Merge Rate: **0.0%**)
* **HITL Review / Quarantine Rate:** 22.22% (10 ambiguous pairs quarantined) (ambiguous cross-case overlaps quarantined to `/review-queue`)
* **Semantic Preservation Rate:** **100.0%** across all multi-modal edge types.

### 3.3 GraphRAG Grounding & Hallucination Resistance
* **Entity Mention Coverage:** **100.0%** (All 4 core syndicate leaders & fronts referenced in AI synthesis)
* **Knowledge Graph Grounding Rate:** **100.0%** (Every referenced entity verified against Neo4j nodes)
* **Evidence Citation Score:** **100.0%** (Grounding claims to verified evidence markers)
* **Unsupported Claim Rate (Hallucination):** **0.0%**

---

## 4. Tier 2: External Dataset Adapter Validation

### 4.1 Unit Fixture Validation (`datasets/external/*/fixtures/`)
| Fixture Source | Classification | Extracted Entities | Extracted Relationships | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **InLegalNER Legal Fixture** | Local Research Fixture | 16 Entities | 14 Edges | **PASS (Canonical)** |
| **ICIJ Offshore Leaks Fixture** | Local Investigative Fixture | 6 Entities | 4 Edges | **PASS (Canonical)** |
| **Enron Email Fixture** | Local Communication Fixture | 4 Entities | 3 Edges | **PASS (Canonical)** |
| **IBM AML Transaction Fixture** | Local Synthetic Fixture | 7 Entities | 5 Edges | **PASS (Canonical)** |
| **SUBTOTAL (FIXTURES)** | **Unit Test Suite** | **33 Entities** | **26 Edges** | **PASS** |

### 4.2 Raw Multi-Source Corpus Standardization (`datasets/external/*/raw/`)
| Raw External Corpus | Official Classification | Extracted Entities | Extracted Relationships | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **InLegalNER Multi-Case Corpus** | Real Research Corpus | 27 Entities | 24 Edges | **PASS (Canonical)** |
| **ICIJ Panama/Pandora Slice** | Real Public Data (Registry Standard) | 11 Entities | 7 Edges | **PASS (Canonical)** |
| **Enron Corporate Email Chain** | Real Public Data | 5 Entities | 5 Edges | **PASS (Canonical)** |
| **IBM AML Multi-Hop Matrix** | Synthetic Research Benchmark | 9 Entities | 8 Edges | **PASS (Canonical)** |
| **SUBTOTAL (RAW CORPUS)** | **Multi-Modal External Data** | **52 Entities** | **44 Edges** | **PASS** |

---

## 5. Architectural Defense for SIH Evaluation

1. **Controlled Validation Foundation:** In forensic investigations, algorithms must first be validated on known ground-truth syndicates before deployment on noisy external data.
2. **Canonical Adapter Layer:** VEILLE transforms diverse external formats (PDF judgments, CSV registries, corporate email dumps) into a unified property graph without modifying the underlying Neo4j Cypher engine.
3. **HITL Integrity over Aggressive Merging:** Rather than forcing risky automated merges that could falsely implicate citizens, VEILLE maintains a 0.0% false merge rate by routing borderline collisions to human supervisor review.
