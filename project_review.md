# CrimeNet / VEILLE v4.0 — Comprehensive Project Review

A thorough code audit of the full stack: Backend (FastAPI + Celery), Frontend (React + Vite), ML Pipeline, and Infrastructure.

---

## 🔴 Critical Issues (Must Fix)

### 1. JWT Secret is Hardcoded & Insecure
**File:** [config.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/core/config.py#L65) + [.env](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/.env#L37)

The JWT secret is literally `CHANGE_ME_USE_A_LONG_RANDOM_STRING_AT_LEAST_64_CHARS` — both in the default config AND the actual `.env` file. Anyone can forge valid auth tokens.

> [!CAUTION]
> **Fix:** Generate a real 64+ character random secret: `python -c "import secrets; print(secrets.token_hex(64))"` and set it in `.env`. Never commit the real secret to version control.

---

### 2. Gemini API Key Exposed in `.env` (Committed to Git)
**File:** [.env](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/.env#L33)

The `GEMINI_API_KEY` is hardcoded in the `.env` file, which is likely tracked by Git. If this repo is ever pushed to a public remote, the key is compromised.

> [!CAUTION]
> **Fix:** Add `.env` to `.gitignore`. Use a `.env.example` template with placeholder values. Rotate the current API key immediately.

---

### 3. Admin Password is Trivial (`admin123`)
**File:** [.env](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/.env#L50), [config.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/core/config.py#L72)

The admin password `admin123` is used in both config defaults AND the seed script. There's no password policy enforcement.

> [!WARNING]
> **Fix:** Enforce minimum password length/complexity in the `LoginRequest` validator. Use a strong default admin password or prompt on first run.

---

### 4. Cypher Injection Vulnerability in Entity Resolver
**File:** [resolver.py](file:///d:/project/Crimenet/CRIMENET_Codebase/ml/entity_resolution/resolver.py#L163-L173)

```python
session.run("""
    MATCH (n:{label})   # ← String formatting into Cypher!
    WHERE n.case_id = $case_id
    ...
""".format(label=candidate_label))
```

The `candidate_label` comes from user-uploaded NLP extraction output and is injected directly via `.format()` into a Cypher query. This is a **Cypher injection** vector.

> [!CAUTION]
> **Fix:** Validate `candidate_label` against an allowlist: `{"Person", "Organization", "Phone", "Account", "Vehicle", "Location", "Event"}`. Reject anything else before constructing the query.

---

### 5. SQL Injection via `ilike` with User Input
**File:** [graph.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/graph.py#L30)

```python
case = db.query(Case).filter(Case.title.ilike(f"%{case_id}%")).first()
```

The `case_id` URL parameter is injected directly into an `ilike` pattern. While SQLAlchemy parameterizes this somewhat, the `%` wildcard wrapping allows pattern-based data enumeration.

> [!WARNING]
> **Fix:** Only accept valid UUIDs for `case_id`. Return 404 immediately if it's not a valid UUID format.

---

## 🟠 Architectural Issues

### 6. Neo4j Session Never Properly Context-Managed
**Files:** [graph.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/graph.py#L64), [review_queue.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/review_queue.py#L129), [resolver.py](file:///d:/project/Crimenet/CRIMENET_Codebase/ml/entity_resolution/resolver.py#L161)

Sessions are manually created with `get_graph_session()` and closed in `finally` blocks. In [review_queue.py L157-161](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/review_queue.py#L157-L161), `session.close()` is called **twice** (once in `except`, once in `finally`).

**Fix:** Use `with` context manager pattern or wrap `get_graph_session()` as a proper FastAPI dependency with `yield`.

---

### 7. Fallback to "First Case in DB" is a Security Hole
**File:** [graph.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/graph.py#L30-L32), [ingestion.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/ingestion.py#L127-L129)

When an invalid `case_id` is provided, the code falls back to `db.query(Case).first()`. This silently serves data from an **unrelated case** — a data isolation breach.

**Fix:** Return 404 immediately for invalid UUIDs. Never silently fall back to another case.

---

### 8. Evidence Endpoint Returns All Evidence on Empty Results
**File:** [ingestion.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/ingestion.py#L132-L136)

When evidence for a specific case is empty, `get_evidence_for_case()` calls `get_all_evidence()`, which returns **demo evidence for all cases**. This leaks cross-case data.

**Fix:** Return an empty list `[]` when no evidence exists for the requested case.

---

### 9. `@app.on_event("startup")` is Deprecated
**File:** [main.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/main.py#L90)

FastAPI deprecated `@app.on_event("startup")`. Use the `lifespan` context manager instead.

**Fix:**
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    ...
    yield
    # shutdown

app = FastAPI(lifespan=lifespan)
```

---

### 10. No Refresh Token Rotation
**File:** [auth.py (router)](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/auth.py#L130-L131)

Comment says `"In production, implement refresh token rotation here for higher security"` but it's never done. Stolen refresh tokens grant indefinite access for 7 days.

**Fix:** Issue a new refresh token on every `/refresh` call, and invalidate the old one (store a blacklist in Redis).

---

## 🟡 Code Quality & Bugs

### 11. Duplicate `Optional` Import
**File:** [review_queue.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/review_queue.py#L15) + [L319](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/review_queue.py#L319)

`Optional` is imported from `typing` at the top AND again at the bottom of the file (line 319). Dead code.

---

### 12. Inconsistent Branding: "CRIMENET" vs "VEILLE"
**Files:** Across the entire codebase

- Backend docstrings alternate between `CRIMENET v4.0` and `VEILLE v4.0`
- Config uses `VEILLE` variable names but `.env` uses `crimenet_*` prefixes
- Celery logger is `crimenet.tasks` but API logger is `veille.main`

**Fix:** Pick one name and standardize everywhere.

---

### 13. Hardcoded Demo Data Instead of Empty States
**Files:** [ingestion.py L65-98](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/ingestion.py#L65-L98), [cases.py L237](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/cases.py#L237), [NetworkExplorer.tsx L22-45](file:///d:/project/Crimenet/CRIMENET_Codebase/frontend/src/components/NetworkExplorer.tsx#L22-L45)

When the DB is empty or APIs fail, the code returns hardcoded demo data (fake evidence, fake node counts `9/12`, fallback graphs). This masks real errors and confuses testing.

**Fix:** Return proper empty states and let the frontend show "No data" UIs.

---

### 14. No Pagination on Any List Endpoint
**Files:** All `GET /` list endpoints — cases, evidence, audit logs, graph nodes

Queries like `db.query(Evidence).all()` and `db.query(Case).all()` will choke on large datasets. Graph queries also lack pagination (`LIMIT 50` is hardcoded but not user-controllable).

**Fix:** Add `?page=1&page_size=25` query parameters to all list endpoints.

---

### 15. Frontend Auth Check Doesn't Use Refresh Token Flow
**File:** [App.jsx](file:///d:/project/Crimenet/CRIMENET_Codebase/frontend/src/App.jsx#L23-L41)

On page load, the frontend only checks if the access token is locally valid (not expired). It **never** calls `/auth/refresh` on startup to get a fresh token. If the access token has expired (after 15 minutes), the user is logged out even though the refresh cookie is valid.

**Fix:** Call `api.post('/auth/refresh')` in the `useEffect` when the access token is expired, before setting `authChecked`.

---

### 16. `delete_case` Writes Audit Log After Deleting
**File:** [cases.py L189-193](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/api/routers/cases.py#L189-L193)

The case is deleted with `db.delete(case)` + `db.commit()` **before** the audit log is written. If the audit log has a foreign key to `cases.id` with `ON DELETE SET NULL`, this works — but the ordering is fragile.

**Fix:** Write the audit log **before** deleting the case, in the same transaction.

---

### 17. Outbox Processor Never Triggered by API Flow
**File:** [outbox_processor.py](file:///d:/project/Crimenet/CRIMENET_Codebase/backend/workers/outbox_processor.py)

The `graph_service.py` writes `NODE_UPSERT` and `EDGE_CREATE` events to the `outbox_events` table, but there's no evidence in the Celery beat schedule that the outbox processor is actually running periodically. Events may pile up without being processed.

**Fix:** Verify Celery Beat is configured to poll the outbox table every 5-10 seconds.

---

## 🔵 Improvement Suggestions

### 18. Add Rate Limiting to Auth Endpoints
No rate limiting on `/auth/login`. An attacker can brute-force passwords.

**Fix:** Use `slowapi` or custom Redis-based rate limiting (e.g., 5 attempts per minute per IP).

---

### 19. Add WebSocket for Real-Time Updates
The frontend polls `/api/v1/jobs/{id}` for task status. This is inefficient.

**Fix:** Implement WebSocket or Server-Sent Events for push-based status updates on evidence processing and graph changes.

---

### 20. Graph Query Performance — Add Neo4j Indexes
No indexes are created on Neo4j nodes for `case_id`, `id`, or `name`. Every query does a full graph scan.

**Fix:** Add constraints/indexes in the seed script:
```cypher
CREATE INDEX node_case_id IF NOT EXISTS FOR (n:Person) ON (n.case_id);
CREATE INDEX node_id IF NOT EXISTS FOR (n:Person) ON (n.id);
```

---

### 21. Frontend: Mixed `.jsx` / `.tsx` — No Consistent Type Safety
About half the components are `.jsx` (no types) and half are `.tsx`. The API client is plain `.js`. This means half the codebase has no type checking.

**Fix:** Migrate all `.jsx` files to `.tsx` and the API client to `.ts`.

---

### 22. No API Versioning Strategy
All routes are under `/api/v1/` but there's no mechanism to introduce `/api/v2/` without breaking clients.

**Fix:** Document the versioning strategy. Consider using header-based versioning for future-proofing.

---

### 23. Add Docker Compose for One-Command Setup
Services (PostgreSQL, Neo4j, Redis) must be started manually. There's an `infrastructure/` directory but no `docker-compose.yml` in the root.

**Fix:** Create a root-level `docker-compose.yml` that spins up all dependencies + the backend + frontend.

---

## Summary Table

| # | Category | Severity | Issue |
|---|----------|----------|-------|
| 1 | Security | 🔴 Critical | JWT secret is the placeholder string |
| 2 | Security | 🔴 Critical | API key committed to `.env` in repo |
| 3 | Security | 🔴 Critical | Admin password is `admin123` |
| 4 | Security | 🔴 Critical | Cypher injection in entity resolver |
| 5 | Security | 🟠 High | SQL pattern injection via `ilike` |
| 6 | Architecture | 🟠 High | Neo4j sessions not context-managed |
| 7 | Architecture | 🟠 High | Silent case fallback breaks isolation |
| 8 | Architecture | 🟠 High | Cross-case data leakage in evidence |
| 9 | Architecture | 🟡 Medium | Deprecated startup event pattern |
| 10 | Security | 🟠 High | No refresh token rotation |
| 11 | Quality | 🟢 Low | Duplicate import |
| 12 | Quality | 🟡 Medium | Inconsistent branding |
| 13 | Quality | 🟡 Medium | Hardcoded demo data masks errors |
| 14 | Performance | 🟠 High | No pagination on list endpoints |
| 15 | Bug | 🟠 High | Frontend auth doesn't use refresh flow |
| 16 | Bug | 🟡 Medium | Audit log written after case deletion |
| 17 | Bug | 🟠 High | Outbox processor may not be scheduled |
| 18 | Security | 🟡 Medium | No rate limiting on login |
| 19 | Performance | 🟡 Medium | Polling instead of WebSocket |
| 20 | Performance | 🟡 Medium | Missing Neo4j indexes |
| 21 | Quality | 🟡 Medium | Mixed jsx/tsx with no type safety |
| 22 | Architecture | 🟢 Low | No API versioning plan |
| 23 | DevOps | 🟡 Medium | No Docker Compose for quick setup |
