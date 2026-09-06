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

## 2. Core Capabilities & Workspace Suite

* **Maltego-Style Investigation Board (`NetworkExplorer.tsx`)**:
  - Powered by `@xyflow/react` (React Flow) with customized entity cards (`Person`, `Vehicle`, `Phone`, `Account`, `Location`, `Organization`, `Event`).
  - Threat score pills (`RISK 85` critical, `RISK 70` elevated, `RISK 30` nominal).
  - Curved directional splines with relationship type badges (`COMMUNICATES_WITH`, `OWNS`, `LOCATED_AT`, `ASSOCIATED_WITH`).
  - Interactive radar mini-map navigator, filter strip, category auto-alignment (Dagre layout), and 1-click camera glide on neighbor selection.
* **Geospatial Intelligence Explorer (`GeospatialExplorer.tsx`)**:
  - Esri Dark Gray Canvas base tiles (clean, zero CARTO watermark clutter).
  - Cell tower azimuth coverage cones, signal triangulation, and suspect movement breadcrumbs.
* **Entity Resolution & Review Queue (`ReviewQueue.tsx`)**:
  - Hybrid scoring formula: $\text{Score} = 0.55 \times \text{Lexical (Jaro-Winkler)} + 0.45 \times \text{Structural (Graph Proximity)}$.
  - Automated triaging: $\ge 0.85$ (`AUTO_MERGE`), $0.50 - 0.85$ (`REVIEW_QUEUE`), $< 0.50$ (`CREATE_NEW`).
  - Human-in-the-loop conflict arbitration with live side-by-side attribute comparison.
* **Transactional Outbox Engine (`outbox_processor.py`)**:
  - Celery Beat poller utilizing row-level locking (`with_for_update(skip_locked=True)`) in PostgreSQL to guarantee multi-worker eventual consistency with Neo4j.
* **AI & NLP Intelligence Engine (`ai.py`)**:
  - Google Gemini 2.5 Flash with strict JSON schema constraints.
  - Offline fallback regex heuristics for phone numbers, bank accounts, vehicle registration numbers, and geo-coordinates.
* **Cryptographic Evidentiary Chain-of-Custody**:
  - Tamper-evident Merkle PBFT append-only audit trail for court admissibility.
  - SHA-256 evidence digests in MinIO S3 object storage.
  - Post-Quantum Cryptography (PQC ML-KEM-1024), HSM enclave quorum ceremonies, and X.509 CRL broadcast.
* **Clinical Tactical UI (`DESIGN.md`)**:
  - Obsidian dark substrates (`#090C10`, `#0F141C`), hairline borders (`#212B3A`), and signature emerald/mint green interactive accents (`#4edea3`, `#6ffbbe`, `#00a572`).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), Leaflet, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Celery, Pydantic v2, SQLAlchemy, Alembic |
| **Databases** | PostgreSQL 16 (Relational SoR), Neo4j 5.x (Knowledge Graph & GDS), Redis 7 (Broker & Cache) |
| **Streaming & Storage** | Apache Kafka & Zookeeper, MinIO (S3-compatible Encrypted Object Storage) |
| **AI / NLP & Audio** | Google Gemini 2.5 Flash, RapidFuzz (Jaro-Winkler), OpenAI Whisper STT, Tesseract OCR |
| **Security & Crypto** | JWT (HttpOnly cookies / Bearer), Argon2, Merkle Tree hashing, ML-KEM-1024, Ed25519 |

---

## 4. Prerequisites

Ensure the following tools are installed on your host system:
* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* [Python 3.11+](https://www.python.org/downloads/)
* [Node.js 18+](https://nodejs.org/) & `npm`
* [Git](https://git-scm.com/)

---

## 5. Setup & Running Instructions

### Step 1: Start Data Infrastructure (Docker Compose)

Navigate to the codebase root and start the container mesh:

```bash
docker-compose up -d
```

*Verifies the following ports:*
* **PostgreSQL**: `localhost:5432`
* **Neo4j**: `localhost:7474` (HTTP) / `localhost:7687` (Bolt)
* **Redis**: `localhost:6379`
* **Kafka**: `localhost:9092`
* **MinIO**: `localhost:9000` (API) / `localhost:9001` (Console)

---

### Step 2: Configure the Backend Environment

In a terminal, navigate to the `backend/` directory and configure the Python virtual environment:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create or verify the `.env` file inside `backend/.env`:
```env
DATABASE_URL=postgresql://veille_user:veille_pass@localhost:5432/veille_db
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=veille_password
REDIS_URL=redis://localhost:6379/0
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
JWT_SECRET=super-secret-jwt-key-for-veille-intelligence-v4
GEMINI_API_KEY=your_gemini_api_key_here
```

**Run Database Migrations & Seed Default Data:**
```bash
# Run database migrations
alembic upgrade head

# Seed admin/investigator accounts and demo cases
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

---

## 6. Access Clearance & Default Credentials

The system provides 1-click role presets directly on the redesigned **Operator Login Screen** (`http://localhost:5173/login`):

| Role | Government Identifier / Email | Security Passphrase | Clearance Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@veille.gov.in` | `admin123` | Top Secret // System-Wide Oversight |
| **Investigator** | `investigator@veille.gov.in` | `investigator123` | Case Restricted // Evidentiary Ingress |

---

## 7. Sample Intelligence Datasets

Pre-built forensic datasets are available under `synthetic_data/samples/` for rapid testing and demonstration:

* **Operation Smuggling Syndicate (`Case 1`)**:
  - `FIR_001_Rajesh_Smuggling.txt` — Unstructured police complaint.
  - `CDR_Oct_2023.csv` — Telecom call detail records.
  - `FIN_Ledger_2023.csv` — Banking transaction records.
* **Operation Falcon Hawala (`Case 2`)**:
  - `FIR_002_Vikram_Hawala.txt` — Cross-border Hawala syndicate complaint.
  - `CDR_Nov_2023_Falcon.csv` — Burner phone intercepts with cell tower coordinates.
  - `FIN_Hawala_Falcon.csv` — Currency layering and shell company ledgers.
  - `INTERROGATION_002_Vikram.txt` — Forensic suspect interrogation transcript.

---

## 8. Comprehensive Architectural Review

For an in-depth evaluation of the platform's distributed design, cryptographic rigor, entity resolution mathematics, bundle scalability, and production scorecard, consult:

* **`../project_review.md`** — Comprehensive Technical & Architectural Review (Score: **9.4 / 10**).
* **`../DESIGN.md`** — Clinical Design System Specifications.

---

## 9. License & Institutional Attribution

*Restricted Access — For Law Enforcement, Intelligence Directorates, and Forensic Audit Units Only.*  
*Copyright © 2026 VEILLE Intelligence Platform. All Rights Reserved.*
