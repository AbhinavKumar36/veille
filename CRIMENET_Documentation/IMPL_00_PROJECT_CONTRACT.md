# VEILLE v4.0 Project Contract & Architecture

> **Version:** 4.0 — Production Implementation
> **Last Updated:** 2026-09-01
> **Status:** ACTIVE — Supersedes all hackathon-era contracts (v2.x, v3.0)

This document defines the strict engineering contract, build order, and the five-engine mental model for the VEILLE platform. It is the canonical reference for the **production implementation phase**.

---

## 0. Current State Assessment

VEILLE has completed its prototype (v3.0) stage. The UI/UX is polished and the infrastructure is scaffolded, but the majority of business logic is **mocked or stubbed**.

| Engine | Design | Implementation | Gap |
|---|---|---|---|
| Interface Engine (Frontend) | ✅ Complete | ⚠️ ~60% (hardcoded fallback data) | Error boundaries, real API calls, WebSocket |
| Application Engine (Backend) | ✅ Designed | ❌ ~10% (mocked responses) | Real DB queries, JWT auth, service layer |
| Intelligence Engine (ML/NLP) | ✅ Designed | ❌ ~5% (hardcoded test data) | Real Gemini extraction, entity resolution |
| Knowledge Engine (Graph) | ✅ Schema defined | ⚠️ ~30% (schema exists, queries mocked) | Real Cypher queries, analytics |
| Infrastructure | ✅ Designed | ⚠️ ~50% (Kafka broken, no Outbox) | Kafka fix, DB sync, observability |

**Overall: Beautiful Prototype → Production MVP requires ~25 developer-days of focused implementation.**

---

## 1. The Five-Engine Mental Model

VEILLE is conceptually and physically separated into five distinct engines:

1. **Proof Engine (Synthetic Data)**: Generates the ground-truth "Answer Key" and noisy unstructured/structured artifacts used to measure the intelligence pipeline. ✅ **COMPLETE**
2. **Intelligence Engine (ML/NLP)**: Consumes raw data, extracts entities (`nlp/`), resolves identities (`entity_resolution/`), and extracts relationships (`relationship_extraction/`). ❌ **NEEDS REAL IMPLEMENTATION**
3. **Knowledge Engine (Graph)**: The `Neo4j` schema, ingestion cyphers, and complex graph analytics (centrality, community detection). ⚠️ **SCHEMA DONE, QUERIES MOCKED**
4. **Application Engine (Backend)**: The `FastAPI` layer that handles API routing, **real JWT authentication**, and async job queue management. ❌ **NEEDS REAL IMPLEMENTATION**
5. **Interface Engine (Frontend)**: The `React` investigator UX — Case Workspace, Network Explorer, Entity Review Queue, real API integration. ⚠️ **UI DONE, BACKEND INTEGRATION NEEDED**

---

## 2. The Production Implementation Build Order

We enforce a strict bottom-up build order, mitigating integration risk layer by layer. **Do not build on a layer until the layer below it is verified.**

### Tier 1 — Foundation (Week 1)
- **STEP 1 — Authentication Layer**: Implement real JWT token generation and `require_role()` middleware validation. Fix session persistence (page-refresh bug).
- **STEP 2 — Real Database Queries**: Replace all mocked Neo4j graph responses with actual Cypher queries. Replace hardcoded case/evidence lists with real PostgreSQL reads.
- **STEP 3 — Kafka Docker Fix**: Fix the Docker listener misconfiguration to restore the CDR streaming pipeline.

### Tier 2 — Intelligence (Week 2)
- **STEP 4 — NLP Extraction**: Remove hardcoded test data from `extractor.py`. Connect to Gemini API. Validate Pydantic schema enforcement.
- **STEP 5 — Entity Resolution**: Implement the real string-distance + graph-proximity matching algorithm.
- **STEP 6 — Celery Error Handling + DLQ**: Wrap all Celery tasks in proper error handling. Route failures to the Redis Dead Letter Queue.

### Tier 3 — Data Integrity (Week 3)
- **STEP 7 — Outbox Pattern**: Implement the PostgreSQL Outbox table and background sync job to keep Postgres and Neo4j consistent.
- **STEP 8 — Graph Analytics**: Implement real centrality and community detection Cypher queries.

### Tier 4 — Quality (Week 4)
- **STEP 9 — Unit Tests**: ML extraction, entity resolution, graph queries. Target: 70% coverage.
- **STEP 10 — Integration Tests**: Full ingestion flow (upload → Neo4j). End-to-end API contracts.
- **STEP 11 — Observability**: Add OpenTelemetry distributed tracing across all services.

### Tier 5 — Frontend Polish (Week 5)
- **STEP 12 — Error Boundaries**: Add React error boundaries and graceful error states to all components.
- **STEP 13 — Real API Integration**: Replace all hardcoded fallback data with live API calls + proper error handling.
- **STEP 14 — WebSocket Live Updates**: Stream graph update events from Postgres → Frontend via WebSocket.
- **STEP 15 — TypeScript Migration**: Convert frontend to TypeScript for type safety.

---

## 3. The Implementation Specifications

Every major component corresponds to a specific implementation spec in this directory.

| Spec | Component | Status |
|---|---|---|
| [IMPL_01_DATABASE_SPEC.md](./IMPL_01_DATABASE_SPEC.md) | PostgreSQL ER Schema | ✅ IMPLEMENTATION READY |
| [IMPL_02_NEO4J_SCHEMA_SPEC.md](./IMPL_02_NEO4J_SCHEMA_SPEC.md) | Neo4j Ontology | ✅ IMPLEMENTATION READY |
| [IMPL_03_API_SPEC.md](./IMPL_03_API_SPEC.md) | FastAPI Ingestion Routes | ✅ IMPLEMENTATION READY |
| [IMPL_04_NLP_SPEC.md](./IMPL_04_NLP_SPEC.md) | LLM Prompts & Pydantic Enforcement | ✅ IMPLEMENTATION READY |
| [IMPL_05_ENTITY_RESOLUTION_SPEC.md](./IMPL_05_ENTITY_RESOLUTION_SPEC.md) | Matching Algorithms | ✅ IMPLEMENTATION READY |
| [IMPL_06_GRAPH_ANALYTICS_SPEC.md](./IMPL_06_GRAPH_ANALYTICS_SPEC.md) | Centrality & Community Detection | ✅ IMPLEMENTATION READY |
| [IMPL_07_SYNTHETIC_DATA_SPEC.md](./IMPL_07_SYNTHETIC_DATA_SPEC.md) | Ground-Truth Generator | ✅ COMPLETE |
| [IMPL_08_EVALUATION_SPEC.md](./IMPL_08_EVALUATION_SPEC.md) | Precision/Recall Benchmarks | ✅ COMPLETE |
| [IMPL_09_FRONTEND_SPEC.md](./IMPL_09_FRONTEND_SPEC.md) | React Component & API Integration | ✅ IMPLEMENTATION READY |
| [IMPL_10_GRAPH_ANALYTICS_SPEC.md](./IMPL_10_GRAPH_ANALYTICS_SPEC.md) | Advanced Analytics | ⏳ IN PROGRESS |
| [IMPL_11_SECURITY_SPEC.md](./IMPL_11_SECURITY_SPEC.md) | JWT Auth & RBAC Enforcement | ✅ IMPLEMENTATION READY |
| [IMPL_12_TESTING_SPEC.md](./IMPL_12_TESTING_SPEC.md) | Testing Pyramid & CI | ✅ IMPLEMENTATION READY |
| [IMPL_13_DEPLOYMENT_SPEC.md](./IMPL_13_DEPLOYMENT_SPEC.md) | Docker, .env, Observability | ✅ IMPLEMENTATION READY |
| [IMPL_14_DATA_SYNC_SPEC.md](./IMPL_14_DATA_SYNC_SPEC.md) | Outbox Pattern (PG ↔ Neo4j) | ✅ IMPLEMENTATION READY |
| [IMPL_15_ERROR_HANDLING_SPEC.md](./IMPL_15_ERROR_HANDLING_SPEC.md) | DLQ, Celery Errors, Alerting | ✅ IMPLEMENTATION READY |
| [IMPL_16_PHASE_ROADMAP.md](./IMPL_16_PHASE_ROADMAP.md) | Master Phase-by-Phase Roadmap | ✅ MASTER REFERENCE |

---

## 4. Definition of Done (Production MVP)

A phase is considered complete only when **all** of the following are true:

- [ ] Code is implemented (not mocked)
- [ ] Unit tests pass with ≥70% coverage for the component
- [ ] Integration test verifies the end-to-end flow for that component
- [ ] No silent failures — all errors are logged and routed to DLQ or surfaced to the UI
- [ ] Relevant IMPL_* spec has `Status: DONE` updated at the top
