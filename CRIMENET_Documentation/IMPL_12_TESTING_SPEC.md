# 12 TESTING SPECIFICATION

**Status:** IMPLEMENTATION READY — Phase 4, Week 4
**Component:** Quality Assurance — Testing Pyramid & CI Pipeline
**Phase:** 4 (Testing & Observability)

This specification defines the testing strategy, tooling, coverage targets, and CI pipeline configuration for VEILLE v4.0.

---

## 1. Current State

| Test Type | Current | Target |
|---|---|---|
| Unit Tests (ML) | ❌ 0 | ≥80% coverage per module |
| Unit Tests (Backend) | ❌ 0 | ≥70% coverage per route |
| Integration Tests | ⚠️ 3 (API only, against mocks) | Full ingestion flow |
| E2E Tests | ❌ 0 | Critical user flows |
| Total Coverage | ~5% | **≥70%** |

---

## 2. Testing Stack

| Layer | Tool | Purpose |
|---|---|---|
| Unit | `pytest` + `pytest-cov` | Python backend and ML module tests |
| Mocking | `unittest.mock` / `pytest-mock` | Mock Gemini API, DB connections |
| Integration | `pytest` + `httpx.AsyncClient` | Test FastAPI routes against real test DB |
| E2E | `Playwright` (Python) | Browser-level flows (login → upload → graph) |
| DB Fixtures | `pytest-asyncio` + `SQLAlchemy` | Spin up/tear down test DB state |
| CI | GitHub Actions | Block PRs on test failure or coverage drop |

---

## 3. Test Database Strategy

All tests must use **isolated test databases**, never the development or production databases.

### 3.1 docker-compose.test.yml

```yaml
# infrastructure/docker/docker-compose.test.yml
version: '3.8'
services:
  test-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: VEILLE_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports: ["5433:5432"]

  test-neo4j:
    image: neo4j:5
    environment:
      NEO4J_AUTH: neo4j/testpassword
      NEO4J_PLUGINS: '["apoc"]'
    ports: ["7475:7474", "7688:7687"]

  test-redis:
    image: redis:7-alpine
    ports: ["6380:6379"]
```

### 3.2 pytest Configuration

```ini
# backend/pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests/
env =
    DATABASE_URL=postgresql://test:test@localhost:5433/VEILLE_test
    NEO4J_URI=bolt://localhost:7688
    NEO4J_PASSWORD=testpassword
    REDIS_URL=redis://localhost:6380
    GEMINI_API_KEY=MOCK_KEY
    JWT_SECRET=test-secret-key-not-for-production
```

---

## 4. Unit Tests

### 4.1 ML / NLP Module (`ml/nlp/`)

**File:** `tests/unit/test_extractor.py`

```python
# Key test cases to implement:

def test_extract_entities_returns_valid_pydantic_model():
    """Mock Gemini API; verify output conforms to ExtractedGraph schema."""

def test_extract_entities_retries_on_validation_error():
    """Return invalid JSON on first 2 calls; verify 3rd attempt is made."""

def test_extract_entities_sends_to_dlq_after_3_failures():
    """Return invalid JSON 3 times; verify DLQ receives the failed job."""

def test_extract_entities_uses_correct_system_prompt():
    """Verify the system prompt contains all 7 entity types and 5 relationship types."""

def test_extract_entities_handles_empty_document():
    """Pass empty string; verify graceful empty-graph response, not exception."""
```

**Coverage target: ≥80%** for `ml/nlp/extractor.py`

### 4.2 Entity Resolution (`ml/entity_resolution/`)

**File:** `tests/unit/test_resolver.py`

```python
def test_resolver_merges_exact_name_match():
    """'Rajesh Kumar' and 'Rajesh Kumar' → same entity."""

def test_resolver_merges_fuzzy_name_match():
    """'Rajesh K.' and 'Rajesh Kumar' with shared phone → merged."""

def test_resolver_does_not_merge_different_people():
    """'Rajesh Kumar' and 'Ramesh Kumar' with no shared attributes → separate."""

def test_resolver_flags_ambiguous_for_human_review():
    """Score between 0.5–0.85 → entity flagged in review queue, not auto-merged."""

def test_resolver_idempotent_on_duplicate_ingestion():
    """Running resolver twice on same data produces identical result."""
```

**Coverage target: ≥80%** for `ml/entity_resolution/resolver.py`

### 4.3 Backend Routes (`backend/api/`)

**File:** `tests/unit/test_auth.py`

```python
def test_login_returns_jwt_on_valid_credentials():
def test_login_returns_401_on_wrong_password():
def test_login_returns_401_on_unknown_email():
def test_protected_route_returns_401_without_token():
def test_protected_route_returns_403_for_wrong_role():
def test_refresh_token_returns_new_access_token():
def test_expired_token_returns_401():
```

---

## 5. Integration Tests

### 5.1 Full Ingestion Flow

**File:** `tests/integration/test_ingestion_flow.py`

```python
async def test_full_fir_ingestion_flow():
    """
    GIVEN: A running test environment (Postgres + Neo4j + Redis + Celery worker)
    WHEN: An authenticated investigator uploads FIR_001_Rajesh.txt to case 'case-001'
    THEN:
      - Evidence record in Postgres has status='COMPLETED'
      - Neo4j contains at least 2 Person nodes linked by ASSOCIATED_WITH
      - Celery job is marked SUCCESS
    """

async def test_invalid_file_type_rejected():
    """
    GIVEN: An authenticated investigator
    WHEN: They upload a .exe file
    THEN: API returns 400 Bad Request; no evidence record created
    """

async def test_ingestion_failure_creates_dlq_entry():
    """
    GIVEN: Gemini API is unavailable (mocked to raise exception)
    WHEN: FIR document is uploaded
    THEN:
      - Evidence status = 'FAILED'
      - DLQ contains 1 entry with the evidence_id
    """
```

### 5.2 Outbox Sync Integration Test

**File:** `tests/integration/test_outbox_sync.py`

```python
async def test_outbox_sync_creates_neo4j_node():
    """
    GIVEN: A Person is created in Postgres with an outbox event
    WHEN: The outbox processor runs
    THEN: The Person node exists in Neo4j with matching properties
    """

async def test_outbox_sync_is_idempotent():
    """
    GIVEN: The same outbox event is processed twice (network retry simulation)
    THEN: Only 1 Neo4j node exists (no duplicates)
    """
```

---

## 6. E2E Tests (Playwright)

**File:** `tests/e2e/test_investigator_flow.py`

```python
def test_login_and_persist_session():
    """
    1. Navigate to http://localhost:5173
    2. Fill in credentials and submit
    3. Verify redirect to dashboard
    4. Refresh the page
    5. Verify user is still logged in (not redirected to login)
    """

def test_upload_fir_and_see_graph_update():
    """
    1. Log in as investigator
    2. Open Case 'Test Case Alpha'
    3. Navigate to Data Ingestion
    4. Upload FIR_001_Rajesh.txt
    5. Click 'Process Batch'
    6. Wait up to 90 seconds
    7. Navigate to Network Explorer
    8. Verify ≥2 nodes visible in the graph
    """

def test_error_state_when_api_offline():
    """
    1. Bring down FastAPI server
    2. Navigate to Network Explorer
    3. Verify error message is visible (not blank screen)
    4. Bring server back up
    """
```

---

## 7. Coverage Requirements

| Module | Minimum Coverage |
|---|---|
| `ml/nlp/` | 80% |
| `ml/entity_resolution/` | 80% |
| `backend/api/` (routes) | 70% |
| `backend/services/` | 70% |
| `backend/auth/` | 90% (security-critical) |
| **Overall** | **≥70%** |

Run coverage report:
```bash
cd VEILLE_Codebase/backend
pytest --cov=. --cov-report=html --cov-fail-under=70
# Report at: htmlcov/index.html
```

---

## 8. CI Pipeline (GitHub Actions)

**File:** `.github/workflows/ci.yml`

```yaml
name: VEILLE CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_DB: VEILLE_test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: ["5433:5432"]
      neo4j:
        image: neo4j:5
        env: { NEO4J_AUTH: neo4j/testpassword }
        ports: ["7688:7687"]
      redis:
        image: redis:7-alpine
        ports: ["6380:6379"]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r VEILLE_Codebase/backend/requirements.txt
      - run: pytest --cov=. --cov-fail-under=70
        working-directory: VEILLE_Codebase/backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/VEILLE_test
          NEO4J_URI: bolt://localhost:7688
          GEMINI_API_KEY: MOCK_KEY
          JWT_SECRET: ci-test-secret
```

**Gate:** PR merge is **blocked** if:
- Any test fails
- Coverage drops below 70%
- Linting (`ruff`) reports errors

---

## 9. Testing Checklist (Definition of Done)

- [ ] `pytest tests/unit/` passes with ≥80% coverage on ML modules
- [ ] `pytest tests/integration/` passes with real test DB (not mocks)
- [ ] `pytest tests/e2e/` passes the login + upload + graph flow
- [ ] `pytest --cov-fail-under=70` exits with code 0
- [ ] GitHub Actions CI runs on every PR
- [ ] `docker-compose.test.yml` spins up a clean test environment
