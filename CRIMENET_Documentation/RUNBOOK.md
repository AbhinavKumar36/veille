# VEILLE v4.0 - Start, Run, and Test Guide

This document provides a complete, step-by-step walkthrough to start the entire VEILLE architecture locally, run the services, and test the pipeline using the synthetic datasets.

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
1. **Docker Desktop** (required for databases and message brokers)
2. **Python 3.11+**
3. **Node.js 20+**
4. (Optional) **GEMINI_API_KEY** environment variable set for live LLM extraction.

---

## Step 1: Start the Infrastructure

VEILLE relies on several heavy backend services (Neo4j for graphs, Postgres for relational data, Redis for queues, MinIO for storage, Kafka/Zookeeper for streaming). 

1. Open a terminal and navigate to the docker directory:
   ```bash
   cd VEILLE_Codebase/infrastructure/docker
   ```
2. Spin up the containers in detached mode:
   ```bash
   docker-compose up -d
   ```
3. **Verify:** Run `docker ps`. You should see `VEILLE-postgres`, `VEILLE-neo4j`, `VEILLE-redis`, `VEILLE-minio`, `VEILLE-zookeeper`, and `VEILLE-kafka` all running. 
*(Wait roughly 60 seconds for Neo4j and Kafka to fully initialize).*

---

## Step 2: Start the Backend Pipeline

The backend consists of the FastAPI web server and the Celery AI worker.

### 2a. Start the FastAPI Server
This server handles authentication and file uploads.
1. Open a new terminal and navigate to the backend:
   ```bash
   cd VEILLE_Codebase/backend
   ```
2. Activate your virtual environment and run the server:
   ```bash
   # (Assuming you already ran `pip install -r requirements.txt`)
   uvicorn api.main:app --reload --port 8000
   ```
3. **Verify:** The terminal should say `Application startup complete` and listen on `http://localhost:8000`.

### 2b. Start the AI Worker (Celery)
This worker handles the heavy NLP extraction, Entity Resolution, and Graph Centrality math in the background.
1. Open a **new** terminal and navigate to the backend:
   ```bash
   cd VEILLE_Codebase/backend
   ```
2. Start the Celery worker:
   ```bash
   celery -A workers.tasks worker --loglevel=info
   ```
3. **Verify:** The terminal should show `[tasks] . extract_entities_task` and `ready.`

---

## Step 3: Start the Frontend UI

This is the React dashboard where investigators interact with the data.
1. Open a **new** terminal and navigate to the frontend:
   ```bash
   cd VEILLE_Codebase/frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. **Verify:** Open your browser and navigate to `http://localhost:5173`. You should see the dark-mode VEILLE Intelligence Hub.

---

## Step 4: How to Manually Test the System

Now that the entire ecosystem is running, here is how you test it using the fake data we generated earlier.

### Step 1: Locate the Test Data
Navigate to `VEILLE_Codebase/synthetic_data/samples/`. You will find three files:
- `FIR_001_Rajesh.txt`
- `CDR_Oct_2023.csv`
- `FIN_Transactions.csv`

### Step 2: Test the Ingestion UI
1. Open the frontend dashboard (`http://localhost:5173`).
2. Click on the **Evidence Library** tab in the sidebar (previously Data Ingestion).
3. Click the **Upload Evidence** button and select `FIR_001_Rajesh.txt`.
4. Click **Process Batch**. You will see the UI shift to "NLP Extracting...", simulating the file being sent to the FastAPI backend and processed by the Celery worker.

### Step 3: Test the Evidence Graph
1. Click on the **Intelligence Hub** tab in the sidebar.
2. In the "Investigation Visualization" panel, make sure **EVIDENCE FLOW** is selected.
3. You will see a narrative flowchart representing the extracted intelligence (e.g., FIR -> Mentions -> Rajesh).
4. **Test Explainability:** Click on the connection line between **Rajesh** and **Amit**. 
5. The **Evidence Drawer** will slide out from the right, explaining exactly *why* the AI linked them together (showing the 47 calls and the FIR mention).

### Step 4: Test the Macro Graph
2. The UI will shift to a physics-based, interactive node network (powered by `react-force-graph-2d`). You can drag nodes around to visualize the raw mathematical connections representing the Neo4j backend data.

---

## Step 5: Automated Testing (v4.0 Test Suite)

As of v4.0, VEILLE includes a comprehensive automated test suite with isolated environments.

### 5a. Spin up the Test Infrastructure
1. Navigate to the docker directory:
   ```bash
   cd VEILLE_Codebase/infrastructure/docker
   ```
2. Start the isolated test containers (uses fast in-memory PostgreSQL `tmpfs`):
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

### 5b. Run the Pytest Suite
1. Navigate to the backend directory:
   ```bash
   cd VEILLE_Codebase/backend
   ```
2. Run the tests with coverage (must pass `--cov-fail-under=70`):
   ```bash
   python -m pytest --cov=. --cov-report=term-missing --cov-fail-under=70
   ```
3. **Verify:** You should see all unit and integration tests pass, testing Auth, NLP extraction, entity resolution, cases, outbox syncing, and the review queue.
