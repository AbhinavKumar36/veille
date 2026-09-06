# VEILLE External Dataset Live Evaluation Report

> **Evaluation Mode:** Real-World Multi-Source Corpus Zero-Shot Ingestion  
> **Evaluated Corpora:** ICIJ Offshore Leaks, Enron Corporate Email Corpus, InLegalNER Court Proceedings, IBM AML Synthetic Benchmark  
> **Status:** Live Graph Verification Complete  

---

## 1. Overview & Objectives

This evaluation assesses VEILLE's ability to ingest, standardize, and query heterogeneous external datasets through the **Canonical Adapter Layer** (`datasets/adapters/`) into live isolated cases without modifying core backend models or graph schema definitions.

```
                  ┌────────────────────────────────────────┐
                  │        RAW EXTERNAL DATASETS           │
                  │  ICIJ CSV • Enron JSON • InLegalNER    │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────────┐
                  │       CANONICAL ADAPTER LAYER          │
                  │   Two-Pass Node Registry Resolution    │
                  └──────────────────┬─────────────────────┘
                                     │ Canonical Graph Bundle
                                     ▼
                  ┌────────────────────────────────────────┐
                  │          VEILLE REST API               │
                  │  Evidence Vaulting • Outbox Sync       │
                  └──────────┬──────────────────┬──────────┘
                             │                  │
                             ▼                  ▼
                  ┌──────────────────┐  ┌──────────────────┐
                  │  PostgreSQL (SoR)│  │ Neo4j Graph DB   │
                  │  SHA-256 Provenance  Multi-Hop Cypher  │
                  └──────────────────┘  └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │ GraphRAG Engine  │
                                        │ Zero-Shot Query  │
                                        └──────────────────┘
```

---

## 2. Ingested External Case Studies

### Case 1: Project Panama (ICIJ Beneficial Ownership Registry)
* **Dataset Domain:** Panama Papers / Pandora Papers investigative registry.
* **Corpus Source:** `datasets/external/icij/raw/icij_panama_pandora_slice.csv`
* **Canonical Graph Extracted:** 11 Entities, 7 Relationships.
* **Key Findings:** Successfully resolved multi-tier ownership chains linking beneficial directors (`Vikramaditya Mehta`, `Elena Rostova`, `Tariq Mansoor`) through offshore shell entities (`Zenith Alpha Holdings`, `Apex Trade Global`) to registered agents and addresses in British Virgin Islands, Cyprus, and Seychelles.
* **Zero-Shot Cypher Traversal:** Resolved 3-hop beneficial ownership paths without type-aliasing errors.

---

### Case 2: Operation Enron (Corporate Collusion & Communication Network)
* **Dataset Domain:** FERC / CMU Enron Email Corpus.
* **Corpus Source:** `datasets/external/enron/raw/enron_corporate_emails.json`
* **Canonical Graph Extracted:** 5 Entities, 5 Communication Edges.
* **Key Findings:** Uncovered communication clusters between executive officers (`Kenneth Lay`, `Jeffrey Skilling`, `Andrew Fastow`, `Richard Causey`, `Sherron Watkins`) regarding off-balance-sheet Special Purpose Vehicles (SPVs) and Raptor hedges.
* **Temporal Intelligence:** Retained timestamped email headers and communication channels in edge property graphs.

---

### Case 3: Judiciary Audit (InLegalNER High Court Statutory Network)
* **Dataset Domain:** Indian Supreme Court & Bombay High Court Judgements.
* **Corpus Source:** `datasets/external/inlegalner/raw/inlegalner_corpus.json`
* **Canonical Graph Extracted:** 27 Entities, 24 Relationships.
* **Key Findings:** Extracted judges, senior advocates (`Kapil Sibal`, `Abhishek Manu Singhvi`, `Mukul Rohatgi`), investigative bodies (`CBI`, `SFIO`, `ED`), and statutory provisions (`IPC 120B`, `IPC 409`, `IPC 420`, `PMLA 2002`, `Companies Act 2013`).
* **Statutory Grounding:** Explicitly mapped statutory sections to the new canonical `Statute` entity type.

---

## 3. Live Zero-Shot Evaluation Summary

| Case Investigation Title | Domain | Evidence Items | Entities in Graph | Relationships | Zero-Shot Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Panama (ICIJ)** | Corporate Crime | 1 Item | 11 Nodes | 7 Edges | **PASS** |
| **Operation Enron (FERC)** | Insider Collusion | 4 Items | 5 Nodes | 5 Edges | **PASS** |
| **Judiciary Audit (InLegalNER)** | Legal Statutes | 3 Items | 27 Nodes | 24 Edges | **PASS** |
| **IBM AML Layering Matrix** | Financial Crime | 1 Item | 9 Nodes | 8 Edges | **PASS** |
| **TOTAL EXTERNAL CORPUS** | **Multi-Modal** | **9 Items** | **52 Nodes** | **44 Edges** | **ALL PASS** |

---

## 4. Key Takeaways for SIH Evaluation

1. **Format Agnostic**: VEILLE processes structured registries (ICIJ CSV), unstructured email dumps (Enron JSON), and court transcripts (InLegalNER JSON) through a unified Canonical schema.
2. **Deterministic Validation**: Separating unit fixtures (`fixtures/`) from raw corpora (`raw/`) ensures automated CI/CD pipeline reliability.
3. **Forensic Traceability**: Every extracted entity in Neo4j links directly back to its source evidence SHA-256 hash in PostgreSQL.
