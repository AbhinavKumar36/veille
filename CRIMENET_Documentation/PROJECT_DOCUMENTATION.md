# VEILLE Intelligence Engine: Complete Technical Documentation

> **System Designation:** VEILLE (Forensic Intelligence & Criminal Network Fusion Platform)  
> **Classification:** Designed for Law Enforcement & Investigative Intelligence Workflows  
> **Version:** v4.2.0 Architecture  
> **Last Updated:** September 2026  

---

## 1. Executive Summary & Core Mission

**VEILLE** is a data-dense, mission-critical intelligence fusion and relationship-analysis platform engineered for law enforcement agencies, cybercrime cells, and forensic investigators. 

Modern syndicates operate across fragmented, multi-modal channels: unstructured First Information Reports (FIRs), encrypted call data records (CDRs), hawala courier transaction ledgers, geospatial intercepts, and shell company registries. Traditional investigative workflows suffer from siloed datasets, manual correlation bottlenecks, hallucination-prone AI summarization, and evidentiary chain-of-custody vulnerabilities.

VEILLE resolves these challenges through a **Dual-Database Architecture (PostgreSQL + Neo4j)**, an **Asynchronous Outbox Event Pipeline**, an **Intent-Aware GraphRAG Query Planner**, and a **Cryptographically Verifiable Evidence Vault** with **Forensic Explainability**.

```
                           ┌────────────────────────────────────────┐
                           │      VEILLE CLINICAL INTELLIGENCE      │
                           │   React 19 + TypeScript + Stitch UI    │
                           └──────────────────┬─────────────────────┘
                                              │ REST + WebSockets
                                              ▼
                           ┌────────────────────────────────────────┐
                           │         FASTAPI API GATEWAY            │
                           │   RBAC • Case Isolation • JWT Cookies  │
                           └──────┬──────────────────────────┬──────┘
                                  │                          │
           Transactional SQL /    │                          │ Celery Tasks /
           Audit Trail / Vault    │                          │ Async Extraction
                                  ▼                          ▼
       ┌───────────────────────────────┐     ┌───────────────────────────────┐
       │     PostgreSQL 15 (SoR)       │     │   Redis 7 + Celery Workers    │
       │  Cases • Users • Evidence     │     │  NLP Extractor • Resolution   │
       │  Outbox Events • Audit Ledger │     │  Hawala Engine • Outbox Sync  │
       └──────────────┬────────────────┘     └───────────────┬───────────────┘
                      │                                      │
                      │  Transactional Outbox Processor      │
                      └───────────────────►──────────────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │   Neo4j 5 Graph DB  │
                               │ Multi-Hop Cypher    │
                               │ Network Dossier     │
                               └─────────────────────┘
```

---

## 2. Technical Stack & Infrastructure Architecture

| Layer | Technologies | Functional Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite 8, Tailwind CSS | Clinical dark-mode dashboard, interactive Force Graph (2D/3D), Leaflet GIS radar, Evidence Modal, and Security consoles. |
| **API Gateway** | FastAPI, Uvicorn, Pydantic v2 | High-throughput async REST endpoints, role-based authorization, case boundaries, and WebSockets. |
| **Relational Storage** | PostgreSQL 15 (Alpine) | System of Record (SoR) for user identities, case assignments, document hashes, audit logs, and transactional outbox. |
| **Graph Database** | Neo4j 5.12 Enterprise (APOC) | Property Graph for multi-hop relationship traversals, entity resolution, and network centrality analytics. |
| **Message Broker** | Redis 7 + Apache Kafka 7.4 | Task queue broker for Celery worker distributed processing and high-velocity CDR telemetry streams. |
| **Task Queue** | Celery 5.3 + Celery Beat | Distributed async workers for LLM extraction, deterministic entity deduplication, and outbox polling. |
| **Object Store** | MinIO (S3-Compatible) + Local Vault | Tamper-evident evidence storage with SHA-256 immutability and presigned download tokens. |
| **AI & NLP** | Google Gemini 1.5 Flash + Regex/NLP | Structured entity/relation extraction, Intent-Aware GraphRAG query planner, and intelligence synthesis. |

---

## 3. The 10 Core Pipelines & Workflow Lifecycle

### Pipeline 1: Authentication & Role-Based Access Control (RBAC)
- **Zero-Trust Session Management**: Issues signed HS256 JWT access tokens (15-min lifespan) paired with `httpOnly` refresh cookies (7-day lifespan) with automatic rotation to eliminate page-refresh logout bugs and prevent XSS.
- **Role Scoping**: Enforces granular permissions between `HEAD` (system-wide supervisory oversight, user provisioning, global audit inspection) and `INVESTIGATOR` (isolated strictly to assigned case dossiers).

### Pipeline 2: Case Lifecycle & Cryptographic Isolation
- Every document, extracted node, and intercept is strictly tagged with a UUIDv4 `case_id`.
- Cross-case access queries by investigators are intercepted at the database and WebSocket layers, returning `403 Forbidden` with an immutable security audit event.

### Pipeline 3: Multi-Source Evidence Ingestion
- **Supported Formats**: Unstructured text/PDF/audio (FIRs, interrogation transcripts, wiretaps) and structured CSV/XLSX (Telecom CDRs, Hawala bank ledgers).
- **Integrity Validation**: Computes SHA-256 hash immediately upon arrival before saving to MinIO object storage. The hash is immutably recorded in PostgreSQL.

### Pipeline 4: Constrained NLP & Entity Extraction
- Employs constrained LLM prompts enforcing a strict JSON schema:
  - **Entity Labels**: `Person`, `Phone`, `Account`, `Vehicle`, `Organization`, `Location`, `Event`.
  - **Relationship Types**: `ASSOCIATED_WITH`, `OWNS`, `COMMUNICATES_WITH`, `LOCATED_AT`, `PARTICIPATED_IN`.
- Includes a 3-retry validation loop with deterministic rule-based fallback extractors for guaranteed execution even in offline environments.

### Pipeline 5: Transactional Outbox & Zero-Data-Loss Graph Sync
- Extraction workers write node/edge creation events to the relational `outbox_events` table within the same ACID transaction as the evidence metadata.
- A dedicated Celery Beat background daemon (`workers/outbox_processor.py`) consumes pending outbox events with `SELECT ... FOR UPDATE SKIP LOCKED` and writes them to Neo4j, guaranteeing **At-Least-Once Delivery** and zero data loss on crashes.
- Employs unique `idempotency_key` hashing to prevent duplicate writes during concurrent extractions.

### Pipeline 6: Entity Resolution & Active Human-in-the-Loop Review Queue
- Automatically detects entity collisions (e.g., matching phone numbers, alias fuzzy matching, or cross-document identifiers).
- High-confidence matches are clustered; ambiguous collisions are dispatched to the **Review Queue** (`/api/v1/review-queue`) for human supervisor sign-off.
- Entity merging dynamically preserves original relationship types and metadata rather than collapsing to generic links.

### Pipeline 7: Geospatial Radar & Coordinate Intelligence
- Extracts geographical coordinates (`lat`, `lng`) from cell tower telemetry, transaction sites, and FIR metadata.
- Integrates a built-in Indian law enforcement geocoding fallback dictionary (Mumbai Port, BKC, Navi Mumbai, New Delhi, Kolkata, etc.) to project suspect locations on the interactive Leaflet GIS map.

### Pipeline 8: Intent-Aware GraphRAG & AI Synthesis
- Rather than blindly dumping documents into an LLM context, VEILLE's **Query Planner** classifies investigator intent:
  1. *Specific Entity Lookup*: Performs multi-hop Cypher neighborhood traversals.
  2. *Financial Conduits & Hawala*: Traverses `Account` and `Organization` transaction paths.
  3. *Global Summary*: Retrieves topological network density and key suspect clusters.
- Resolves raw evidence document IDs into human-readable citations for court-admissible forensic reporting.

### Pipeline 9: Tamper-Evident Security Audit Ledger
- Captures an immutable trail of every sensitive user action: `LOGIN`, `CREATE_CASE`, `UPLOAD_EVIDENCE`, `QUERY_GRAPH`, `MERGE_ENTITY`, `EXPORT_GRAPH`, and `ACCESS_DENIED`.
- Enables supervisory integrity audits with cryptographic timestamps and actor attribution.

### Pipeline 10: System Telemetry & Gateway Health Monitoring
- Real-time health probes (`/api/v1/health`) monitor PostgreSQL connection pool stats, Neo4j Bolt cluster connectivity, Redis cache latency, and Celery worker pings.

---

## 4. Key Architectural Features (Phases A, B, C)

### 4.1 Phase A: Security Hardening & Outbox Idempotency
- **Strict Investigator Scoping**: Added multi-tenant checks to `backend/api/routers/ingestion.py` and `backend/api/routers/ws.py`. Investigators cannot view, upload to, or receive WebSocket updates for cases to which they are not explicitly assigned.
- **Outbox Idempotency Keys**: Added `idempotency_key = Column(String(64), unique=True, index=True)` on `OutboxEvent` models in `backend/db/models.py` to prevent duplicate graph mutations.
- **Defensible Cryptography UI**: Updated UI headers to **"Cryptographic Operations & Key Vault"** and **"PKI & Trust Operations Console"** to align with real software-backed KMS and CA standards.

### 4.2 Phase B: Evidence Vault & Provenance (MinIO / S3)
- **`StorageService` (`backend/core/storage.py`)**: S3-compatible object storage service with non-blocking socket health checks, bucket creation (`veille-evidence`), and local filesystem fallback.
- **Evidence Preview & Download APIs**:
  - `GET /api/v1/evidence/{id}/preview`: Streams document previews directly to the frontend modal.
  - `GET /api/v1/evidence/{id}/download`: Generates secure presigned download URLs or binary streams.
- **Interactive Evidence Modal (`frontend/src/components/EvidenceLibrary.tsx`)**: Allows instant inspection of vaulted files with SHA-256 hash verification badges.

### 4.3 Phase C: Graph Intelligence & Explainability
- **"WHY THIS CONNECTION?" Forensic Drawer (`frontend/src/components/NetworkExplorer.tsx`)**: Clicking any graph edge opens an explainability panel detailing:
  - Source and target entity roles and properties.
  - Algorithm confidence score gauge.
  - Direct evidentiary citation (FIR / CDR / Hawala ledger).
  - Telemetry duration, transaction amounts, and temporal timestamps.
- **Semantic Merges (`backend/api/routers/review_queue.py`)**: Merging entity duplicates retains the precise semantic relationship types (`OWNS`, `COMMUNICATES_WITH`, `LOCATED_AT`, `PARTICIPATED_IN`) rather than converting all links to generic relationships.
- **Intent-Aware GraphRAG Query Planner (`backend/api/routers/ai.py`)**: Classifies user queries and queries Neo4j dynamically across multiple hops before prompting Gemini for high-accuracy synthesis.

---

## 5. API Reference & Endpoint Catalog

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user, issue access token & refresh cookie | Public |
| `POST` | `/api/v1/auth/refresh` | Rotate access token via httpOnly cookie | Bearer Token |
| `POST` | `/api/v1/auth/logout` | Invalidate session & clear refresh cookie | Bearer Token |
| `GET` | `/api/v1/cases` | List all accessible cases for the user | Investigator / Head |
| `POST` | `/api/v1/cases` | Create new investigative case dossier | Investigator / Head |
| `GET` | `/api/v1/cases/{id}/stats` | Retrieve node, edge, and evidence counts | Case Assigned |
| `GET` | `/api/v1/evidence` | List evidence records for accessible cases | Investigator / Head |
| `POST` | `/api/v1/evidence/upload` | Upload evidence (FIR/CDR/Financial) | Case Assigned |
| `GET` | `/api/v1/evidence/{id}/preview` | Fetch evidence preview content | Case Assigned |
| `GET` | `/api/v1/evidence/{id}/download` | Download raw vaulted evidence file | Case Assigned |
| `GET` | `/api/v1/graph/{case_id}` | Fetch full node/relationship graph dossier | Case Assigned |
| `GET` | `/api/v1/geospatial/nodes` | Retrieve geolocated pins for map display | Case Assigned |
| `GET` | `/api/v1/review-queue` | List pending entity collision candidates | Head / Supervisor |
| `POST` | `/api/v1/review-queue/merge` | Merge duplicate entities preserving links | Head / Supervisor |
| `POST` | `/api/v1/ai/query` | GraphRAG multi-hop AI intelligence synthesis | Case Assigned |
| `GET` | `/api/v1/audit-logs` | Retrieve immutable system audit records | Head / Admin |
| `GET` | `/api/v1/health` | Comprehensive infrastructure health status | Public |
| `WS` | `/api/v1/ws/{case_id}` | Real-time graph update intelligence stream | Case Assigned |

---

## 6. Verification & Automated Testing

VEILLE includes a full automated end-to-end test suite in `backend/scripts/test_pipeline_e2e.py` verifying all 10 pipelines against live services with realistic datasets (Syndicate 2026 FIR, Telecom CDRs, Hawala bank ledgers).

### Running the Test Suite
```bash
# In backend virtual environment:
python backend/scripts/test_pipeline_e2e.py
```

### Clean System Reset & Seeding
```bash
# Reset database and establish fresh indexes:
python backend/seed.py
```

### Frontend Production Build
```bash
npm --prefix frontend run build
```

---

## 7. Competitive Edge & Hackathon Differentiation

1. **Defensible Evidentiary Chain of Custody**: Every node and relationship in the graph links directly to a vaulted, SHA-256 verified source document.
2. **Clinical Forensic Aesthetic**: Bespoke dark-mode Stitch Design System engineered for real tactical intelligence analysts rather than generic consumer AI chat tools.
3. **Multi-Source Hybrid Fusion**: Simultaneously ingests unstructured narrative police reports, structured telecom call records, and financial transaction matrices into a single cohesive graph topology.
4. **Zero Data Loss Guarantee**: ACID relational transactional outbox pattern guarantees that even during high-load ingestion or worker crashes, every extracted entity is safely stored and synchronized to Neo4j.
