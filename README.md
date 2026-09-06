# VEILLE Intelligence Engine

VEILLE is a high-stakes, data-dense "Clinical Intelligence" platform designed for automated entity extraction, resolution, and visualization of criminal networks. It processes unstructured data (e.g., FIRs, transcripts, financial records) and structured data (CDRs) to build an interactive, mathematically rigorous Knowledge Graph.

## Architecture & Tech Stack

*   **Frontend**: React (Vite) + TypeScript, styled with Tailwind CSS, utilizing `react-force-graph` and `react-leaflet`.
*   **Backend**: FastAPI (Python 3.11+), handling authentication (JWT via cookies), data routing, and role-based access control (`HEAD` vs `INVESTIGATOR`).
*   **Data Infrastructure**:
    *   **PostgreSQL**: Relational storage (Users, Evidence, Audit Logs).
    *   **Neo4j**: Native graph database (Entities, Relationships).
    *   **Kafka & Zookeeper**: Event streaming for high-throughput pipelines.
    *   **Redis**: Message broker for Celery AI tasks and caching.
    *   **MinIO**: Object storage for unstructured evidence.
*   **AI Pipeline**: Python-based Celery workers using Gemini API integration for entity extraction.

---

## Prerequisites

Ensure you have the following installed on your system:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop)
*   [Python 3.11+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)

---

## Setup & Running Instructions

### 1. Start the Data Infrastructure

Navigate to the codebase root and start the underlying services using Docker Compose:

```bash
cd CRIMENET_Codebase
docker-compose up -d
```
*Note: This will spin up PostgreSQL, Neo4j, Kafka, Zookeeper, Redis, and MinIO. Wait a few moments for the containers to fully initialize.*

### 2. Configure the Backend (FastAPI & Celery)

Open a new terminal, navigate to the backend directory, and set up your Python environment:

```bash
cd CRIMENET_Codebase/backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Set up your `.env` file in the `backend` directory (a `.env.example` should be provided) and include your `GEMINI_API_KEY`.

**Seed the Database** (Initializes admin credentials and tables):
```bash
python seed.py
```

### 3. Run the Backend Services

You need to run the following services in **separate terminal windows** (ensure the virtual environment is activated in each):

**Terminal A - FastAPI Server:**
```bash
cd CRIMENET_Codebase/backend
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal B - Celery Worker:**
*(Note: On Windows, `-P solo` is required)*
```bash
cd CRIMENET_Codebase/backend
celery -A workers.celery_app worker -l INFO -P solo
```

**Terminal C - Celery Beat (Scheduler):**
```bash
cd CRIMENET_Codebase/backend
celery -A workers.celery_app beat -l INFO
```

**Terminal D - Kafka Consumer:**
```bash
cd CRIMENET_Codebase/backend
python -m workers.kafka_consumer
```

### 4. Configure & Run the Frontend

Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite development server:

```bash
cd CRIMENET_Codebase/frontend
npm install
npm run dev
```

### 5. Access the Application

Open your browser and navigate to the Vite server address (usually `http://localhost:5173`).

**Default Login:**
*   **Email**: `admin@veille.gov.in`
*   **Password**: `admin123`
*(Ensure you use the HEAD/ADMIN credentials generated during the `seed.py` step).*
