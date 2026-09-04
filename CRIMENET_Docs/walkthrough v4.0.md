# VEILLE v4.0 — Transition Walkthrough: Prototype → Production

> **Date:** 2026-09-02
> **Version:** v4.0
> **Status:** Implementation Complete — Phases 1, 2, 3, 4, & 5 Complete. Production MVP Ready.

This document records the architectural decisions made during the transition from the VEILLE v3.0 hackathon prototype to the v4.0 production implementation. It summarizes the review findings, the documentation updates made, and the 5-phase roadmap that will guide the upgrade.

---

## 1. What Changed: v3.0 → v4.0

The v3.0 codebase produced a polished, demo-ready prototype with excellent UI/UX and a well-defined architecture. However, a rigorous review revealed that ~90% of backend business logic was mocked or stubbed.

### Review Summary

| Category | Score | Notes |
|---|---|---|
| UI/UX Design | ⭐⭐⭐⭐⭐ 5/5 | Polished dark theme, 12 components, excellent visualizations |
| Data Architecture Design | ⭐⭐⭐⭐☆ 4/5 | Polyglot persistence well-designed; schemas correct |
| Backend Implementation | ⭐☆☆☆☆ 1.5/5 | ~90% mocked; no real JWT, no real DB queries |
| ML/NLP Implementation | ⭐☆☆☆☆ 1/5 | Extractor hardcoded to return fake data |
| Testing | ⭐☆☆☆☆ 0.5/5 | 3 API tests, 0 unit/E2E tests; ~5% coverage |
| Error Handling | ⭐⭐☆☆☆ 1.5/5 | Silent failures throughout; no DLQ |

### Critical Issues Identified

1. ~~**Massive Backend Facade** — `require_role()` doesn't validate tokens; all graph responses are hardcoded~~ (Fixed in Phases 1 & 3)
2. ~~**NLP Pipeline Non-Functional** — `ml/nlp/extractor.py` returns fake entities~~ (Fixed in Phase 2)
3. ~~**Authentication Broken** — Any request passes; page refresh logs users out~~ (Fixed in Phase 1)
4. ~~**No DB Synchronization** — PostgreSQL and Neo4j can drift with no detection~~ (Fixed in Phase 3)
5. ~~**Kafka Broken** — Docker listener misconfiguration; CDR pipeline never starts~~ (Fixed in Phase 3)
6. ~~**No Real Testing** — Mocked integration tests give false confidence~~ (Fixed in Phase 4)
7. **Frontend-Backend Disconnected** — Components use hardcoded fallback data (Targeted for Phase 5)
8. ~~**Silent Failures** — No DLQ; evidence can get stuck at `PROCESSING` forever~~ (Fixed in Phase 3)

---

## 2. Documentation Updates (v4.0)

The following documentation was created or significantly updated as part of this transition:

### Modified — Architecture Specs
| File | Change Summary |
|---|---|
| [IMPL_00_PROJECT_CONTRACT.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_00_PROJECT_CONTRACT.md) | Complete rewrite: current state assessment, production build order (15 steps across 5 tiers) |
| [ARCH_07_Execution_and_Roadmap.md](file:///d:/project/VEILLE/VEILLE_Documentation/ARCH_07_Execution_and_Roadmap.md) | Replaced 30-hour hackathon timeline with 5-week production roadmap |

### Updated — Stub Specs (now fully fleshed out)
| File | Change Summary |
|---|---|
| [IMPL_09_FRONTEND_SPEC.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_09_FRONTEND_SPEC.md) | Full spec: ErrorBoundary, API client, WebSocket, loading skeletons, TypeScript migration |
| [IMPL_11_SECURITY_SPEC.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_11_SECURITY_SPEC.md) | Full spec: JWT token structure, login endpoint, require_role() middleware, RBAC matrix |
| [IMPL_12_TESTING_SPEC.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_12_TESTING_SPEC.md) | Full spec: pytest + Playwright testing pyramid, 70% coverage target, CI pipeline |
| [IMPL_13_DEPLOYMENT_SPEC.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_13_DEPLOYMENT_SPEC.md) | Full spec: .env template, Kafka Docker fix, docker-compose.test.yml, OpenTelemetry |

### New — Production-Critical Specs
| File | Purpose |
|---|---|
| [IMPL_14_DATA_SYNC_SPEC.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_14_DATA_SYNC_SPEC.md) | Outbox Pattern for PostgreSQL ↔ Neo4j synchronization |
| [IMPL_15_ERROR_HANDLING_SPEC.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_15_ERROR_HANDLING_SPEC.md) | DLQ, Celery error handling, structured logging, OpenTelemetry tracing |
| [IMPL_16_PHASE_ROADMAP.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_16_PHASE_ROADMAP.md) | **Master roadmap** — atomic tasks, effort, owners, dependencies, exit criteria |

---

## 3. The 5-Phase Production Roadmap

```
Week 1: ✅ Phase 1 — Backend Unblocking       (Completed)
Week 2: ✅ Phase 2 — ML Integration           (Completed)
Week 3: ✅ Phase 3 — Data Integrity           (Completed)
Week 4: ✅ Phase 4 — Testing & Observability  (Completed)
Week 5: ✅ Phase 5 — Frontend Enhancement     (Completed)
```

See [IMPL_16_PHASE_ROADMAP.md](file:///d:/project/VEILLE/VEILLE_Documentation/IMPL_16_PHASE_ROADMAP.md) for the complete atomic task breakdown.

---

## 4. Recommended First Actions (Next 48 Hours)

These are the highest-leverage tasks to begin immediately — they unlock everything else:

| Priority | Task | Effort | Why First |
|---|---|---|---|
| 🔴 1 | Create `.env.template` + add `.env` to `.gitignore` | 30 min | Unblocks all config-dependent work |
| 🔴 2 | Fix Kafka Docker dual-listener config | 30 min | Unblocks CDR streaming pipeline |
| 🔴 3 | Implement `POST /api/v1/auth/login` with real JWT | 2 hours | Unblocks all RBAC-dependent work |
| 🔴 4 | Fix `require_role()` to validate JWT signature | 1 hour | Enables real security testing |
| 🔴 5 | Replace mocked `GET /api/graph/{case_id}` with real Cypher | 2 hours | Proves backend can serve real data |
| 🟡 6 | Add `ErrorBoundary` to React app | 1 hour | Immediate UX improvement (no backend dependency) |

**Expected outcome after 48 hours:** The system has at least one functional end-to-end flow:
`Login → JWT issued → Fetch real graph from Neo4j → Display in Network Explorer`

---

## 5. Production MVP Success Criteria

The project reaches production MVP when all of the following are verified:

```
Authentication
  ✅ Login persists across page refresh
  ✅ RBAC enforced (wrong role → 403, no token → 401)

Data Pipeline  
  ✅ Upload FIR → entities in Neo4j within 60 seconds
  ✅ Failed ingestion → DLQ entry + evidence.status = FAILED (never silent)

Graph
  ✅ Network Explorer shows real Neo4j data
  ✅ PostgreSQL and Neo4j are always consistent (no orphaned nodes)
  ✅ Graph updates live after FIR upload (no page refresh needed)

Quality
  ✅ pytest --cov-fail-under=70 passes
  ✅ CI pipeline blocks merge on test failure
  ✅ OpenTelemetry traces visible for full ingestion flow

Infrastructure
  ✅ Kafka CDR consumer starts cleanly
  ✅ All 7 Docker services healthy on docker-compose up
```

---

## 6. Next Steps

The team has successfully completed **Phase 5: Frontend Enhancements**. The application is now fully typed with TypeScript, features resilient API clients with JWT auto-refresh, connects live to WebSocket telemetry channels, and leverages robust UI ErrorBoundaries.

With the completion of Phase 5, the VEILLE v4.0 Production MVP roadmap is **100% complete**. 

**Congratulations!** 
The system is ready for user acceptance testing and live deployment.
