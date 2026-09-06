# VEILLE // INTEL-ENGINE (v4.0 PROD)
### National Security, Threat Matrix & Forensic Relationship Fusion Platform

VEILLE (formerly CRIMENET) is an enterprise-grade forensic intelligence and multi-source relationship analysis platform. It is engineered to ingest heterogeneous, semi-structured, and unstructured intelligence feeds—including police First Information Reports (FIRs), Telecom Call Detail Records (CDRs), financial transaction ledgers (hawala & banking), interrogation transcripts, SIGINT packet streams, and audio intercepts—and fuse them into a coherent, high-confidence knowledge graph.

---

## 1. System Architecture & Topology

VEILLE employs a **Dual-Lakehouse / Polyglot Persistence Pattern** that cleanly separates relational, transactional truth (System of Record) from high-cardinality graph topology:

```
                           ┌─────────────────────────────────────────────────────────┐
                           │          VEILLE TACTICAL HUD (React + Vite)             │
                           │   React Flow Board • Leaflet Map • Comms • HSM Vault    │
                           └────────────────────────────┬────────────────────────────┘
                                                        │ REST / WSS / JWT
                                                        ▼
                           ┌─────────────────────────────────────────────────────────┐
                           │              FASTAPI REST & WEBSOCKET CORE              │
                           │       Auth (JWT/RBAC) • Routers • Telemetry • SSE       │
                           └────────┬───────────────────┬───────────────────┬────────┘
                                    │                   │                   │
             ┌──────────────────────┴──────┐            │            ┌──────┴──────────────────────┐
             ▼                             ▼            │            ▼                             ▼
    ┌──────────────────┐          ┌──────────────────┐  │  ┌──────────────────┐          ┌───────────────────┐
    │  PostgreSQL 16   │          │   Neo4j 5.x GDS  │  │  │   Redis 7 Mesh   │          │    MinIO Vault    │
    │  System-of-Record│          │  Knowledge Graph │  │  │ Pub/Sub & Broker │          │  Encrypted Files  │
    │  Outbox Events   │          │  Centrality/PageR│  │  │ Review Queue     │          │  Court Dossiers   │
    └──────────────────┘          └──────────────────┘  │  └──────────────────┘          └───────────────────┘
                                                        ▼
                                           ┌───────────────────────────┐
                                           │  Distributed Celery Mesh  │
                                           │  Outbox Poller • Whisper  │
                                           │  NER • OCR • Kafka Ingress│
                                           └───────────────────────────┘
```

---

## 2. Core Capabilities & Forensic Pipeline

* **Maltego-Style Investigation Board (`NetworkExplorer.tsx`)**:
  - Powered by `@xyflow/react` (React Flow) with customized entity cards (`Person`, `Vehicle`, `Phone`, `Account`, `Location`, `Organization`, `Event`).
  - Risk score badges (`RISK 85` critical, `RISK 70` elevated, `RISK 30` nominal).
  - Curved directional splines with relationship type badges (`COMMUNICATES_WITH`, `OWNS`, `LOCATED_AT`, `ASSOCIATED_WITH`).
  - Interactive radar mini-map navigator, category filtering, auto-alignment (Dagre layout), and 1-click camera glide on neighbor selection.
* **Geospatial Intelligence Explorer (`GeospatialExplorer.tsx`)**:
  - Dark canvas base tiles with clean vector overlays.
  - Cell tower azimuth coverage cones, signal triangulation, and suspect movement breadcrumbs.
* **Pairwise Entity Resolution & Review Queue (`ReviewQueue.tsx`)**:
  - Hybrid scoring formula: $\text{Score} = 0.55 \times \text{Lexical (Jaro-Winkler)} + 0.45 \times \text{Structural (Graph Proximity)}$.
  - Triaging zones: $\ge 0.85$ (`AUTO_MERGE`), $0.50 - 0.85$ (`REVIEW_QUEUE` quarantine), $< 0.50$ (`CREATE_NEW`).
  - Human-in-the-loop (HITL) conflict arbitration with side-by-side attribute comparison to prevent erroneous merges of innocent lookalikes.
* **Transactional Outbox Engine (`outbox_processor.py`)**:
  - Celery Beat poller utilizing row-level locking (`with_for_update(skip_locked=True)`) in PostgreSQL to guarantee multi-worker eventual consistency with Neo4j.
* **Claim-Level GraphRAG Intelligence Engine (`ai.py`)**:
  - Graph-grounded contextual query synthesis using Google Gemini.
  - Sentence-level verification against live Neo4j triples and PostgreSQL evidence records to prevent hallucinations.
* **Tamper-Evident Evidentiary Audit Trail**:
  - SHA-256 evidence hashing and immutable audit logging for chain-of-custody tracking.
  - MinIO S3-compatible encrypted object storage for raw evidence files.
* **Clinical Tactical UI (`DESIGN.md`)**:
  - Obsidian dark substrates (`#090C10`, `#0F141C`), hairline borders (`#212B3A`), and emerald interactive accents (`#4edea3`, `#6ffbbe`, `#00a572`).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), Leaflet, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Celery, Pydantic v2, SQLAlchemy, Alembic |
| **Databases** | PostgreSQL (Relational SoR), Neo4j 5.x (Knowledge Graph & GDS), Redis 7 (Broker & Cache) |
| **Storage & Ingestion** | MinIO (S3-compatible Object Storage), Canonical Dataset Adapter Layer |
| **AI / NLP** | Google Gemini, RapidFuzz (Jaro-Winkler), Tesseract OCR heuristics |
| **Security & Auth** | JWT Authentication (Bearer / HttpOnly cookies), Argon2 password hashing, RBAC |

---

## 4. Dataset Taxonomy & Provenance

VEILLE categorizes all evaluation data into three distinct tiers:

1. **Real External Datasets (Public / Research)**:
   - **InLegalNER**: Official Indian High Court & Supreme Court legal judgments corpus (OpenNyAI).
   - **ICIJ Offshore Leaks**: Panama & Pandora Papers entity registry slice (ODbL / CC-BY-SA).
   - **Enron Email Corpus**: FERC / CMU corporate email records with authentic communication headers.
2. **Synthetic Research Benchmarks**:
   - **IBM AMLWorld**: Controlled transaction graph matrix for multi-hop layering and smurfing detection.
3. **Controlled Ground-Truth Benchmark**:
   - **Operation Storm Watch**: End-to-end multi-modal ground-truth case (FIR, CDR, AML) for zero-defect pipeline validation.

---

## 5. Setup & Running Instructions

### Step 1: Start Data Infrastructure (Docker Compose)

Navigate to the codebase root and start the container mesh:

```bash
docker-compose up -d
```

---

### Step 2: Initialize Backend Database & Demo Seed

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Run migrations and seed baseline accounts
python seed.py
```

---

### Step 3: Launch Backend Services

Run each service in a separate terminal with the virtual environment activated:

**Terminal 1 — FastAPI Server:**
```bash
cd backend
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Celery Worker:**
```bash
cd backend
# On Windows:
celery -A workers.celery_app worker --loglevel=info --pool=solo
# On Linux / Production:
celery -A workers.celery_app worker --loglevel=info --concurrency=4
```

**Terminal 3 — Celery Beat (Outbox Poller):**
```bash
cd backend
celery -A workers.celery_app beat --loglevel=info
```

**Terminal 4 — Kafka Consumer (Optional for live stream simulation):**
```bash
cd backend
python -m workers.kafka_consumer
```

---

### Step 4: Configure & Launch Frontend

Open a new terminal and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 6. Access Control & Configuration

Authentication credentials and API keys are managed securely via environment configuration:
- Copy `.env.example` to `.env` in `backend/` and configure secret keys and database URLs.
- Initial seed accounts (`Administrator` and `Investigator` roles) are generated during `python seed.py` for local development.

---

## 7. Empirical Evaluation & Reproducibility

To execute the two-tier empirical benchmark suite across both the controlled ground-truth case and external dataset adapters:

```bash
# Run dataset acquisition and manifest generation
python datasets/download_datasets.py

# Run Canonical Adapters
python datasets/run_adapters.py

# Run Live Empirical Benchmark Suite
python ml/evaluation/benchmark_suite.py
```

Benchmark output and confusion matrices are published to `../CRIMENET_Documentation/BENCHMARK_REPORT.md`.

---

## 8. License & Attribution

*Research and educational forensic intelligence prototype.*  
*MIT License — Developed for Smart India Hackathon (SIH).*
