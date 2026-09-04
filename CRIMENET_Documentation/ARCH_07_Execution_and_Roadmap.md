# Layer 7: Execution & Production Roadmap

> **Version:** 4.0 — Production Implementation Roadmap
> **Last Updated:** 2026-09-01
> **Supersedes:** Hackathon 30-hour timeline (v3.0)

This document replaces the hackathon execution plan with a realistic, week-by-week production implementation roadmap. The goal is to transform VEILLE from a polished prototype (UI-complete, backend-mocked) into a **fully functional intelligence fusion platform**.

---

## 1. Current State vs. Target State

| Dimension | Current (Prototype) | Target (Production MVP) |
|---|---|---|
| Authentication | `require_role()` exists but doesn't validate tokens | Real JWT, session persistence, RBAC enforced |
| Backend API | ~90% hardcoded/mocked responses | Real DB queries for all endpoints |
| NLP Pipeline | Hardcoded fake entity data | Real Gemini extraction with Pydantic enforcement |
| Entity Resolution | Stub returning mock matches | String-distance + graph-proximity algorithm |
| Graph (Neo4j) | Schema defined, queries mocked | All CRUD + analytics via real Cypher |
| DB Synchronization | No mechanism | Outbox Pattern (Postgres ↔ Neo4j) |
| Kafka / CDR Stream | Broken (Docker misconfiguration) | Fixed and functional |
| Error Handling | Silent failures everywhere | DLQ, structured logging, alerting |
| Testing | 5% coverage (3 API tests) | 70% coverage (unit + integration + E2E) |
| Frontend | Hardcoded fallback data | Real API integration + error boundaries + WebSocket |

**Total estimated effort:** ~25 developer-days across 5 weeks.

---

## 2. Team Allocation

| Role | Responsibility |
|---|---|
| **Backend Lead** | FastAPI services, JWT auth, real DB queries, Outbox Pattern |
| **ML Engineer** | NLP extraction (Gemini), entity resolution, Celery worker hardening |
| **QA Engineer** | Unit tests, integration tests, E2E tests, CI pipeline |
| **Frontend Engineer** | Error boundaries, real API integration, WebSocket, TypeScript migration |

> _A single senior full-stack developer can cover Backend + DevOps; QA can be shared with ML._

---

## 3. Five-Phase Roadmap

### Phase 1 — Backend Unblocking (Week 1)
**Priority: CRITICAL** — Nothing else can be built without this.

| Task | Effort | Owner | Dependencies | Success Criteria |
|---|---|---|---|---|
| Implement JWT token generation in `/api/auth/login` | 1 day | Backend | PostgreSQL running | `POST /login` returns signed JWT |
| Add token validation to `require_role()` middleware | 0.5 day | Backend | JWT impl | Unauthorized requests return 401 |
| Fix session persistence (page-refresh logout bug) | 0.5 day | Backend | JWT impl | Token stored in `httpOnly` cookie or localStorage with refresh logic |
| Replace mocked Neo4j graph response with real Cypher | 2 days | Backend | Neo4j running | `/api/graph/{case_id}` returns real nodes/edges |
| Replace mocked case list with real PostgreSQL query | 0.5 day | Backend | PostgreSQL | `/api/cases` returns persisted records |
| Fix Kafka Docker listener misconfiguration | 0.5 day | DevOps | Docker Compose | `docker ps` shows Kafka healthy; CDR consumer starts |
| Add `.env.template` with all required secrets | 0.5 day | DevOps | None | `cp .env.template .env` enables full local setup |
| **Phase 1 Subtotal** | **~5.5 days** | | | |

**Phase 1 Exit Criteria:**
- [ ] Investigator can log in and session persists across page refresh
- [ ] `/api/graph/{case_id}` returns real data from Neo4j
- [ ] Kafka consumer starts successfully on `docker-compose up`

---

### Phase 2 — ML & Intelligence Engine (Week 2)
**Priority: CRITICAL** — Core differentiator of the platform.

| Task | Effort | Owner | Dependencies | Success Criteria |
|---|---|---|---|---|
| Remove hardcoded test data from `ml/nlp/extractor.py` | 0.5 day | ML | Gemini API key in `.env` | `extract_entities()` calls real Gemini API |
| Implement Pydantic validation + 3-retry loop on LLM output | 1 day | ML | Extractor working | Invalid LLM output triggers retry; 3rd failure → DLQ |
| Test Gemini extraction on 5 sample FIR documents | 1 day | ML | Extractor stable | Manual review of extracted entity JSON passes sanity check |
| Implement real entity resolution algorithm (string-distance + graph proximity) | 2 days | ML | Extraction working | `resolve_entities()` merges "Rajesh K." and "Rajesh Kumar" correctly |
| Wrap all Celery tasks in try/except + DLQ routing | 1 day | Backend | Celery + Redis | Failed tasks appear in `dlq:failed_jobs` Redis key |
| Add Celery task status endpoint (`GET /api/jobs/{job_id}`) | 0.5 day | Backend | Celery | Frontend can poll job status |
| **Phase 2 Subtotal** | **~6 days** | | | |

**Phase 2 Exit Criteria:**
- [ ] Upload a real FIR PDF → entities appear in Neo4j within 60 seconds
- [ ] Failed document processing creates DLQ entry and sets evidence status to `FAILED`
- [ ] Entity resolution correctly deduplicates test cases with ≥80% precision

---

### Phase 3 — Data Integrity & Sync (Week 3)
**Priority: HIGH** — Prevents silent data corruption and compliance violations.

| Task | Effort | Owner | Dependencies | Success Criteria |
|---|---|---|---|---|
| Create `outbox_events` table in PostgreSQL via Alembic migration | 0.5 day | Backend | PostgreSQL | Table exists with correct schema |
| Write to `outbox_events` on every Neo4j-affecting operation | 1 day | Backend | Outbox table | Every graph mutation has a corresponding outbox entry |
| Implement background Celery beat job to process outbox | 1 day | Backend | Celery, Neo4j | Outbox entries are consumed and graph is updated within 5 seconds |
| Implement idempotency key to prevent duplicate graph mutations | 0.5 day | Backend | Outbox processor | Replaying an outbox event twice does not create duplicate nodes |
| Test cascading deletes: delete Case → verify Neo4j cleanup | 1 day | QA | Outbox impl | All orphaned graph nodes are removed |
| Implement real graph analytics Cypher (centrality, community detection) | 2 days | Backend/Graph | Neo4j real queries | `GET /api/analytics/{case_id}` returns real PageRank scores |
| **Phase 3 Subtotal** | **~6 days** | | | |

**Phase 3 Exit Criteria:**
- [ ] Deleting a Case removes all corresponding Neo4j nodes (no orphans)
- [ ] Simulated Postgres restart + Neo4j restart: data is fully consistent after recovery
- [ ] `/api/analytics/{case_id}` returns real centrality scores, not hardcoded values

---

### Phase 4 — Testing & Observability (Week 4)
**Priority: HIGH** — Required for production confidence and compliance.

| Task | Effort | Owner | Dependencies | Success Criteria |
|---|---|---|---|---|
| Write unit tests for `ml/nlp/extractor.py` (mock Gemini API) | 1 day | QA | Extractor stable | Coverage ≥ 80% on extraction module |
| Write unit tests for entity resolution algorithm | 1 day | QA | ER stable | Coverage ≥ 80% on resolver module |
| Write integration tests for full ingestion flow (upload → Neo4j) | 1.5 days | QA | Phase 1+2 done | `pytest tests/integration/` passes end-to-end |
| Write integration test for Outbox sync (Postgres → Neo4j) | 0.5 day | QA | Phase 3 done | Simulated outbox processing test passes |
| Add OpenTelemetry instrumentation to FastAPI + Celery workers | 1.5 days | DevOps | All services stable | Traces visible in Jaeger at `localhost:16686` |
| Add docker-compose.test.yml for isolated test environment | 0.5 day | DevOps | None | `docker-compose -f docker-compose.test.yml up` gives clean test DB |
| Configure CI pipeline (GitHub Actions) with test gate | 1 day | DevOps | Tests passing | PR blocks merge if tests fail or coverage drops below 70% |
| **Phase 4 Subtotal** | **~7 days** | | | |

**Phase 4 Exit Criteria:**
- [ ] `pytest --cov` reports ≥ 70% total coverage
- [ ] CI pipeline runs on every PR and blocks merge on failure
- [ ] OpenTelemetry traces show the full lifecycle of a document ingestion request

---

### Phase 5 — Frontend Enhancement (Week 5)
**Priority: MEDIUM** — Polish and real-time usability.

| Task | Effort | Owner | Dependencies | Success Criteria |
|---|---|---|---|---|
| Add `ErrorBoundary` component wrapping all major route components | 0.5 day | Frontend | None | Crashed component shows friendly error UI, not blank screen |
| Replace all hardcoded fallback data with real API calls | 1 day | Frontend | Phase 1 done | Network Explorer shows live Neo4j data |
| Add loading skeletons and progress indicators for async operations | 0.5 day | Frontend | Real API calls | Investigator sees animated skeleton during data fetch |
| Implement WebSocket listener for real-time graph updates | 1.5 days | Frontend | Phase 3 (Outbox) | Uploading a FIR updates the graph live without page refresh |
| Add explicit API error states (404, 500, network offline) | 0.5 day | Frontend | Real API calls | Investigator sees "Unable to load graph — retry" instead of blank |
| Begin TypeScript migration for `src/components/` | 1 day | Frontend | None | All components in `components/` have `.tsx` extensions and proper typing |
| **Phase 5 Subtotal** | **~5 days** | | | |

**Phase 5 Exit Criteria:**
- [ ] Uploading a FIR updates the Network Explorer graph in real-time (no manual refresh)
- [ ] All 12 components render proper error states when API is unavailable
- [ ] TypeScript builds with zero type errors on the `components/` directory

---

## 4. Technical Debt Backlog (Post-MVP)

These items are tracked but **not required** for the production MVP:

| Item | Priority | Notes |
|---|---|---|
| Convert entire frontend to TypeScript | Medium | Phase 5 starts with `components/` only |
| Add GraphQL layer for complex graph queries | Medium | Replace REST for graph-heavy endpoints |
| Implement Redis caching for frequently accessed graphs | Medium | Cache invalidated by Outbox processor |
| Add rate limiting to all API endpoints | High | Prevent Gemini API quota exhaustion |
| Migrate to FastAPI dependency injection | Medium | Better testability |
| Implement CQRS (separate read/write models) | Low | Post-scale requirement |
| Kubernetes manifests for production deployment | Low | Post-MVP infrastructure |

---

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| Gemini API quota exceeded | High | Medium | Add rate limiting + result caching in Redis; use mock in tests | ML |
| Neo4j ↔ Postgres desync | High | High | Outbox Pattern (Phase 3) with idempotency keys | Backend |
| Kafka keeps failing | Medium | High | Fix Docker config (Phase 1); add CDR CSV fallback if Kafka is down | DevOps |
| ML extraction too slow (>30s/doc) | Medium | Medium | Async processing (already in Celery); add progress polling endpoint | ML |
| Authentication bypass | High | Low | Security audit after Phase 1 completion; add integration test for 401 paths | Backend |
| Data loss on ingestion failure | High | Medium | DLQ + evidence status = `FAILED` + investigator alert | Backend |
| Page refresh logging users out | Medium | High | Fix in Phase 1 (httpOnly cookie or refresh token) | Backend |

---

## 6. Production MVP Success Criteria

The system is considered **production-ready MVP** when every item below is checked:

- [ ] Investigator can log in and session persists across page refresh
- [ ] Investigator can create a Case and it persists to PostgreSQL
- [ ] FIR document can be uploaded and entities extracted into Neo4j within 60 seconds
- [ ] Network graph displays **real** entities from Neo4j (not hardcoded mock data)
- [ ] Geospatial map shows **real** incident locations from the graph
- [ ] All graph mutations are reflected in both PostgreSQL and Neo4j (no orphans)
- [ ] Failed ingestion creates a DLQ entry and alerts the investigator
- [ ] Audit logs record all user actions (read, write, export)
- [ ] System handles errors gracefully with user-visible feedback
- [ ] ≥70% test coverage across unit + integration tests
- [ ] CI pipeline blocks merge on test failure

See [IMPL_16_PHASE_ROADMAP.md](./IMPL_16_PHASE_ROADMAP.md) for the atomic task-by-task breakdown.
