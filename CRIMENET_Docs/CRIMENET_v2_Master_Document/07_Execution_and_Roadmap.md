# 10. MVP Scope & Team Architecture

A 6-person team cannot build a 40-page theoretical platform in a hackathon window. The architecture described in this document represents the *end state*. The SIH deliverable is a vertical slice that proves the core engine works.

## 10.1 The MVP Scope Cut
**What is IN Scope (The Red Path):**
- Data Ingestion (PDF & CSV)
- NLP Entity/Relationship Extraction (using a pre-trained model)
- Entity Resolution (Name matching + basic graph proximity)
- Neo4j Knowledge Graph (Core nodes: Person, Phone, Location)
- Investigator UX (Network Explorer + Entity Review Queue)

**What is OUT of Scope (Stubbed/Mocked for Presentation):**
- Temporal Intelligence Layer
- Geospatial Layer (Show a static map screenshot in the pitch deck)
- Advanced RAG Assistant (Limit Q&A to a single demo case)
- Multi-tenant RBAC (Hardcode a single 'Investigator' role for the demo)

## 10.2 Team-to-Module Mapping (6 Members)
To prevent bottlenecks, the team must decouple their work streams on Day 1.

| Member | Role | Responsibility |
| :--- | :--- | :--- |
| **M1** | Pipeline Lead | Ingestion API, CSV/PDF parsing, Synthetic Data Generator |
| **M2** | ML Engineer | NLP extraction, Entity Resolution Engine, Python workers |
| **M3** | Graph Engineer | Neo4j schema definition, Cypher queries, Centrality analytics |
| **M4** | Backend/Infra | PostgreSQL schema, FastAPI backend, Dockerization |
| **M5** | Frontend Eng. | React app, Case Workspace, Entity Review Queue |
| **M6** | Lead/Demo | Flagship Network Explorer graph UI, Pitch Deck, Judge Q&A |

---

# 11. Build Roadmap

| Phase | Deliverable | Deadline (Hackathon Timeline) |
| :--- | :--- | :--- |
| **Phase 0** | Schema defined, Synthetic Data generated, Repos initialized. | Prep Week |
| **Phase 1** | Ingestion -> NLP -> PostgreSQL (Data flows, but no graph yet). | Hackathon Hr 8 |
| **Phase 2** | Entity Resolution -> Neo4j (The Graph exists and is queryable). | Hackathon Hr 16 |
| **Phase 3** | UI connected to backend. Network Explorer renders nodes. | Hackathon Hr 24 |
| **Phase 4** | **Demo Hardening.** Rehearsal, snapshot backups, UI polish. | Hackathon Hr 30 |

---

# 12. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Live Demo Fails** | Fatal. Graph doesn't render or API crashes under load. | We script a "Judge-Facing Demo Mode." We maintain a database snapshot of a known-good state. We also record a 3-minute video backup of the flagship flow. |
| **LLM Rate Limits** | High. OpenAI/Anthropic API blocks requests during the demo. | The core pipeline (Extraction -> Resolution -> Graph) runs locally or via non-LLM models. The LLM is an add-on, not a blocker. |
| **Overengineering** | High. Team spends 20 hours setting up Kubernetes instead of features. | Deploy on a single large EC2 instance using `docker-compose`. |
| **Entity Resolution Fails** | Medium. Wrong nodes merge, making the AI look stupid. | Enforce the Human-in-the-Loop review queue. Show the judges that the system *knows* when it is unsure. |
