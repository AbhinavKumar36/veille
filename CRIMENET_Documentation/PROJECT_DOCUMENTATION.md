# VEILLE Intelligence Engine: Project Documentation

## 1. Project Overview
**VEILLE** is a high-stakes, data-dense "Clinical Intelligence" platform designed for automated entity extraction, resolution, and visualization of criminal networks. It processes unstructured data (e.g., FIRs, transcripts, financial records) and structured data (CDRs) to build an interactive, mathematically rigorous Knowledge Graph. 

The system leverages AI-driven NLP to establish connections between entities (people, organizations, events, locations, vehicles) and visualizes them using interactive React-based interfaces.

---

## 2. Architecture & Tech Stack

### 2.1 Frontend (User Interface)
*   **Framework**: React (Vite) with TypeScript
*   **Styling**: Tailwind CSS (v3 with PostCSS), following a bespoke "Stitch Design System" tailored for a premium intelligence agency aesthetic (dark mode, monospaced typography, precise functional colors).
*   **Key Dependencies**:
    *   `react-router-dom`: SPA Routing (simulated via state-based tab switching)
    *   `react-force-graph-2d` / `3d`: For complex network topologies.
    *   `react-leaflet` / `leaflet`: Geospatial tracking and OSM rendering.
*   **Core Modules**:
    *   **Login Terminal**: Secure, functional authentication gate with Role-Based Access Control (HEAD vs INVESTIGATOR).
    *   **Dashboard / Executive Overview**: High-level KPIs, intelligence extraction metrics.
    *   **Network Explorer**: Interactive graph visualization of connected entities.
    *   **AI Intel Assistant**: Strictly constrained RAG-style chat interface with evidence citations and fallback rules.
    *   **System Health**: Real-time Kafka telemetry and pipeline metrics dashboard.
    *   **Live Intercept / Audit Logs**: Dense data tables for monitoring active transmissions and system security.

### 2.2 Backend (API Gateway)
*   **Framework**: FastAPI (Python 3.11+)
*   **Server**: Uvicorn
*   **Current State**: Full production-like endpoints (`cases.py`, `users.py`, `graph.py`, `geospatial.py`, `ai.py`) with complete end-to-end integration with PostgreSQL and Neo4j. Handles authentication and token rotation.

### 2.3 Data Infrastructure (Dockerized)
The underlying infrastructure relies on a heavy data pipeline, defined in `docker-compose.yml`:
*   **PostgreSQL**: Relational storage for raw documents, system users, and audit trails.
*   **Neo4j**: Native graph database for storing resolved entities and relationships.
*   **Apache Kafka & Zookeeper**: Event streaming for high-throughput data ingestion and pipeline orchestration.
*   **Redis**: Message broker for Celery AI tasks.
*   **MinIO**: S3-compatible object storage for unstructured evidence (images, PDFs, audio).

### 2.4 AI Pipeline (Celery)
*   **Workers**: Python-based Celery workers handle intensive background tasks (NLP Extraction, Entity Resolution, Centrality calculation).

---

## 3. Directory Structure

```text
CRIMENET_Codebase/
│
├── frontend/                     # React User Interface
│   ├── src/
│   │   ├── components/           # All UI Modules (Dashboard, NetworkExplorer, etc.)
│   │   ├── App.tsx               # Main state routing and auth gate
│   │   ├── Layout.tsx            # Main sidebar and shell layout
│   │   └── index.css             # Tailwind Directives
│   ├── tailwind.config.js        # Design System tokens (Colors, Typography)
│   └── postcss.config.js         # v3 PostCSS configuration
│
├── backend/                      # FastAPI Server
│   ├── api/
│   │   ├── main.py               # Application entrypoint & CORS config
│   │   ├── routers/              # Endpoint definitions (cases, users, graph, ai, etc.)
│   │   └── auth.py               # Authentication middleware and JWT issuance
│   ├── core/                     # Configuration (database, telemetry)
│   ├── db/                       # SQLAlchemy models and Alembic migrations
│   └── workers/                  # Celery tasks (NLP, Resolution, Outbox)
│
├── synthetic_data/               # Generators and samples for mock intelligence
│
└── docker-compose.yml            # Infrastructure deployment (Postgres, Neo4j, Kafka, Redis)
```

---

## 4. Operational Status (v4.0 Progress)
    
### What is Working
*   **Frontend UI Shell**: The complete Stitch Design System has been migrated. All major UI modules are fully functional, interactive, and responsive. Components have been typed with TypeScript and wired directly to the real API endpoints and WebSocket channels for real-time telemetry.
*   **Authentication & Roles**: Secure JWT `httpOnly` cookie rotation implemented. Role-Based Access Control enforced at the API layer with `HEAD` and `INVESTIGATOR` case-isolation.
*   **Backend API & Real Data**: FastAPI is successfully integrated with real PostgreSQL (for auth and raw evidence) and Neo4j (for graphs). The Celery Outbox pattern ensures DB synchronization.
*   **ML & NLP Pipeline**: Real entity extraction via Gemini API integration, rule-based fallback intelligence, and local resolution matching are functional via Celery workers.
*   **Geospatial & Graph Visualizations**: Both Leaflet maps and Force-directed graphs render correctly within the clinical design aesthetic.

---

## 5. Setup & Running Instructions

Please refer to the comprehensive `README.md` in the `CRIMENET_Codebase` directory for detailed, step-by-step instructions on spinning up the full Docker infrastructure, running Celery workers, seeding the database, and starting the FastAPI and Vite servers.
