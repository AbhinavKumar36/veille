# 13 DEPLOYMENT SPECIFICATION

**Status:** IMPLEMENTATION READY — Phase 1 + Phase 4
**Component:** Infrastructure — Docker, Environment, Observability
**Phase:** 1 (Kafka fix, .env) + 4 (OpenTelemetry)

This specification defines the complete local development environment setup, environment variable management, Kafka configuration fix, test environment isolation, and observability stack for VEILLE v4.0.

---

## 1. Environment Variable Management

### 1.1 The Problem

Credentials (Postgres password, Gemini API key, JWT secret) are currently hardcoded in various config files. This is a security risk and makes environment switching (dev / test / prod) unreliable.

### 1.2 `.env.template` (commit this, never the actual `.env`)

Create this file at the **project root** (`d:\project\VEILLE\.env.template`):

```dotenv
# =============================================================
# VEILLE v4.0 — Environment Configuration Template
# =============================================================
# INSTRUCTIONS: Copy this file to .env and fill in real values.
#   cp .env.template .env
# NEVER commit .env to version control.
# =============================================================

# --- PostgreSQL ---
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=VEILLE
POSTGRES_USER=VEILLE_user
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Constructed from above — used by SQLAlchemy
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# --- Neo4j ---
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=CHANGE_ME_NEO4J_PASSWORD

# --- Redis ---
REDIS_URL=redis://localhost:6379/0

# --- MinIO / S3 Object Storage ---
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=CHANGE_ME_MINIO_SECRET
MINIO_BUCKET_NAME=VEILLE-evidence

# --- Kafka ---
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CDR_TOPIC=cdr-ingestion
KAFKA_GROUP_ID=VEILLE-consumers

# --- Gemini AI API ---
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-1.5-flash

# --- JWT Authentication ---
JWT_SECRET=CHANGE_ME_USE_A_LONG_RANDOM_STRING_AT_LEAST_64_CHARS
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# --- Application ---
APP_ENV=development         # development | test | production
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=http://localhost:5173

# --- OpenTelemetry (Observability) ---
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=VEILLE-backend
OTEL_TRACES_EXPORTER=otlp

# --- Admin Bootstrap ---
ADMIN_EMAIL=admin@VEILLE.gov.in
ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
```

**Add to `.gitignore`:**
```
.env
*.env.local
```

---

## 2. Fixed docker-compose.dev.yml

### 2.1 The Kafka Problem

The current Kafka container fails to start because it advertises itself with `localhost` but Docker containers communicate via internal hostnames. The fix is to configure **two listeners**: one for internal Docker network and one for the host machine.

```yaml
# infrastructure/docker/docker-compose.dev.yml

version: '3.8'

services:
  # ── PostgreSQL ──────────────────────────────────────────
  postgres:
    image: postgres:15-alpine
    container_name: VEILLE-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-VEILLE}
      POSTGRES_USER: ${POSTGRES_USER:-VEILLE_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-devpassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${POSTGRES_USER:-VEILLE_user}"]
      interval: 10s
      retries: 5

  # ── Neo4j ────────────────────────────────────────────────
  neo4j:
    image: neo4j:5-community
    container_name: VEILLE-neo4j
    restart: unless-stopped
    environment:
      NEO4J_AUTH: ${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-devpassword}
      NEO4J_PLUGINS: '["apoc", "graph-data-science"]'
      NEO4J_dbms_memory_pagecache_size: 512M
    ports:
      - "7474:7474"   # Browser UI
      - "7687:7687"   # Bolt protocol
    volumes:
      - neo4j_data:/data
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:7474"]
      interval: 15s
      retries: 10

  # ── Redis ────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: VEILLE-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  # ── MinIO ────────────────────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: VEILLE-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-miniopassword}
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console UI
    volumes:
      - minio_data:/data

  # ── Zookeeper ────────────────────────────────────────────
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: VEILLE-zookeeper
    restart: unless-stopped
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  # ── Kafka ────────────────────────────────────────────────
  # FIX: Use two listeners to solve the Docker networking issue
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: VEILLE-kafka
    restart: unless-stopped
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"   # External (host machine) access
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      # KEY FIX: Two separate listeners for internal vs external access
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_LISTENERS: INTERNAL://0.0.0.0:29092,EXTERNAL://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka:29092,EXTERNAL://localhost:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 30s
      retries: 10

  # ── Jaeger (OpenTelemetry Tracing UI) ────────────────────
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: VEILLE-jaeger
    ports:
      - "16686:16686"  # Jaeger UI
      - "4317:4317"    # OTLP gRPC receiver
    environment:
      COLLECTOR_OTLP_ENABLED: "true"

volumes:
  postgres_data:
  neo4j_data:
  minio_data:
```

**Verify the fix:**
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
docker ps
# All 7 containers should be healthy within 60 seconds
docker exec VEILLE-kafka kafka-topics --list --bootstrap-server localhost:9092
# Should list topics without error
```

---

## 3. Test Environment (docker-compose.test.yml)

```yaml
# infrastructure/docker/docker-compose.test.yml
# For isolated CI/CD and local test runs — uses different ports to avoid dev conflicts

version: '3.8'

services:
  test-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: VEILLE_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports: ["5433:5432"]

  test-neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/testpassword
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - "7475:7474"
      - "7688:7687"

  test-redis:
    image: redis:7-alpine
    ports: ["6380:6379"]
```

Run tests against the test environment:
```bash
docker-compose -f infrastructure/docker/docker-compose.test.yml up -d
cd VEILLE_Codebase/backend
DATABASE_URL=postgresql://test:test@localhost:5433/VEILLE_test \
NEO4J_URI=bolt://localhost:7688 \
REDIS_URL=redis://localhost:6380 \
pytest tests/
docker-compose -f infrastructure/docker/docker-compose.test.yml down -v
```

---

## 4. OpenTelemetry Distributed Tracing

### 4.1 FastAPI Instrumentation

```python
# backend/api/main.py — add at app startup

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor

def setup_telemetry(app):
    if settings.APP_ENV == "production" or settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT)
        provider = TracerProvider()
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        FastAPIInstrumentor.instrument_app(app)
        SQLAlchemyInstrumentor().instrument()
        RedisInstrumentor().instrument()
```

### 4.2 Celery Task Tracing

```python
# backend/workers/tasks.py

from opentelemetry import trace
tracer = trace.get_tracer(__name__)

@celery_app.task
def extract_entities_task(evidence_id: str):
    with tracer.start_as_current_span("extract_entities", attributes={"evidence.id": evidence_id}):
        # task logic here
        pass
```

**View traces:** Open `http://localhost:16686` (Jaeger UI) after `docker-compose up`

---

## 5. Database Migration Management

Use **Alembic** for all schema changes. Never modify tables manually.

```bash
# Generate a migration
cd VEILLE_Codebase/backend
alembic revision --autogenerate -m "add_outbox_events_table"

# Apply migrations
alembic upgrade head

# Check current revision
alembic current
```

All migrations live in `backend/alembic/versions/`. The CI pipeline must run `alembic upgrade head` before tests.

---

## 6. Deployment Checklist (Definition of Done)

**Phase 1 Items:**
- [ ] `.env.template` committed to repo root
- [ ] `.env` added to `.gitignore`
- [ ] Kafka Docker listener fix applied — `docker ps` shows Kafka healthy
- [ ] `docker exec VEILLE-kafka kafka-topics --list --bootstrap-server localhost:9092` succeeds
- [ ] All 7 services start cleanly with `docker-compose up -d`

**Phase 4 Items:**
- [ ] `docker-compose.test.yml` exists and starts a clean isolated test environment
- [ ] OpenTelemetry traces appear in Jaeger UI at `localhost:16686` during a real ingestion flow
- [ ] Alembic migrations are the only way to modify DB schema (no manual SQL)
- [ ] CI pipeline runs `docker-compose.test.yml` for integration tests
