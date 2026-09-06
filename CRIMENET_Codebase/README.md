# VEILLE (formerly CRIMENET)
**Restricted Intelligence System v4.0**

VEILLE is an advanced intelligence platform designed for law enforcement and intelligence agencies to ingest, analyze, and visualize complex criminal networks. It uses a combination of natural language processing (NLP), multi-modal ingestion, and graph database analytics to automatically turn unstructured evidence (FIRs, CDRs, Audio) into highly connected, actionable knowledge graphs.

## Core Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React-Force-Graph.
- **Backend**: FastAPI (Python), Celery (Async Task Queue).
- **Databases**: PostgreSQL (Relational Data), Neo4j (Graph Data), Redis (Caching & Pub/Sub).
- **Streaming**: Apache Kafka.
- **AI/NLP**: Google Gemini, Whisper (Audio Transcription), Tesseract (OCR).

---

## Prerequisites
Before setting up the project, ensure you have the following installed on your system:
- **Docker** and **Docker Compose**
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Tesseract OCR** (System level installation required for image processing)

---

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory by copying the template:
```bash
cp .env.template backend/.env
```
Ensure you add your `GEMINI_API_KEY` to the `.env` file for the NLP extraction to function.

### 2. Infrastructure (Docker)
Start the foundational databases and message brokers:
```bash
docker-compose up -d
```
This spins up:
- **PostgreSQL** (Port 5432)
- **Neo4j** (Port 7474 / 7687)
- **Redis** (Port 6379)
- **Kafka** (Port 9092)

### 3. Backend Setup (FastAPI & Celery)
Open a terminal and navigate to the `backend/` directory:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

**Run Database Migrations & Seed Data:**
```bash
# Apply Alembic migrations for PostgreSQL
alembic upgrade head

# Seed initial admin users and cases
python seed.py
```

### 4. Frontend Setup (React/Vite)
Open a new terminal and navigate to the `frontend/` directory:
```bash
cd frontend
npm install
```

---

## Running the Application

To run the full VEILLE platform locally, you need to start several services in parallel.

### 1. Start the FastAPI Backend
In the `backend/` directory (with your virtual environment activated):
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Celery Worker (AI Processing)
In the `backend/` directory:
```bash
# On Windows, add -P solo
celery -A workers.celery_app worker --loglevel=info -P solo
```

### 3. Start the Celery Beat (Outbox Sync)
In the `backend/` directory:
```bash
celery -A workers.celery_app beat --loglevel=info
```

### 4. Start the Kafka Consumer (Streaming Ingestion)
In the `backend/` directory:
```bash
python workers/kafka_consumer.py
```

### 5. Start the React Frontend
In the `frontend/` directory:
```bash
npm run dev
```

---

## Usage

1. Open your browser and navigate to `http://localhost:5173/`.
2. Login using the seeded admin credentials:
   - **Email:** `admin@veille.gov.in`
   - **Passcode:** `admin123`
3. Navigate to the **Network Explorer** to visualize data.
4. Use the `synthetic_data/samples/` directory to upload test FIRs, CSVs, and Audio files to see the real-time graph extraction in action!
