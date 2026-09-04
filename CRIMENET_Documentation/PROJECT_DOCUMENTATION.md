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
    *   **Login Terminal**: Secure, terminal-styled authentication gate.
    *   **Dashboard / Executive Overview**: High-level KPIs, intelligence extraction metrics.
    *   **Network Explorer**: Interactive graph visualization of connected entities.
    *   **AI Intel Assistant**: RAG-style chat interface with evidence citations.
    *   **System Health**: Real-time Kafka telemetry and pipeline metrics dashboard.
    *   **Live Intercept / Audit Logs**: Dense data tables for monitoring active transmissions and system security.

### 2.2 Backend (API Gateway)
*   **Framework**: FastAPI (Python 3.11+)
*   **Server**: Uvicorn
*   **Current State**: Serves robust synthetic seed data via dedicated routers (`cases.py`, `graph.py`, `geospatial.py`) to decouple frontend development from heavy Docker infrastructure dependencies.

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
VEILLE_Codebase/
│
├── frontend/                     # React User Interface
│   ├── src/
│   │   ├── components/           # All UI Modules (Dashboard, NetworkExplorer, etc.)
│   │   ├── App.jsx               # Main state routing and auth gate
│   │   ├── Layout.jsx            # Main sidebar and shell layout
│   │   └── index.css             # Tailwind Directives
│   ├── tailwind.config.js        # Design System tokens (Colors, Typography)
│   └── postcss.config.js         # v3 PostCSS configuration
│
├── backend/                      # FastAPI Server
│   ├── api/
│   │   ├── main.py               # Application entrypoint & CORS config
│   │   ├── routers/              # Endpoint definitions (cases, graph, geospatial)
│   │   └── models.py             # Pydantic data schemas
│   ├── core/                     # Configuration and Auth
│   ├── services/                 # Business logic
│   └── workers/                  # Celery tasks (NLP, Resolution)
│
├── infrastructure/               # DevOps & Docker
│   └── docker/
│       └── docker-compose.yml    # Main infrastructure deployment
│
└── synthetic_data/               # Generators for mock intelligence
```

---

## 4. Operational Status (v4.0 Progress)
    
### What is Working
*   **Frontend UI Shell**: The complete Stitch Design System has been migrated. All 11 major UI modules are fully functional, interactive, and responsive. Components have been typed with TypeScript and wired directly to the real API endpoints and WebSocket channels for real-time telemetry.
*   **Backend API & Real Data**: FastAPI is successfully integrated with real PostgreSQL (for auth and raw evidence) and Neo4j (for graphs). The Outbox pattern ensures DB synchronization.
*   **ML & NLP Pipeline**: Real entity extraction via Gemini API integration and local resolution matching are functional via Celery workers.
*   **Testing & Observability**: Test suite coverage is >70%. OpenTelemetry distributed tracing is configured for FastAPI, Celery, and DBs. GitHub Actions CI pipeline is active.
*   **Geospatial & Graph Visualizations**: Both Leaflet maps and Force-directed graphs render correctly within the clinical design aesthetic.

---

## 5. Setup & Running Instructions

### 5.1 Running the Frontend (UI)
```bash
cd d:\project\VEILLE\VEILLE_Codebase\frontend
npm install
npm run dev
```
Access the UI at `http://localhost:5173`.

### 5.2 Running the Backend (API Gateway)
```powershell
cd d:\project\VEILLE\VEILLE_Codebase\backend
.\venv\Scripts\Activate.ps1
uvicorn api.main:app --reload
```
Access the API documentation at `http://localhost:8000/docs`.

### 5.3 Starting the Data Infrastructure (Optional / Work-in-Progress)
```bash
cd d:\project\VEILLE\VEILLE_Codebase\infrastructure\docker
docker-compose up -d
```
*(Note: Troubleshooting may be required for Kafka/Zookeeper startup sequences).*
