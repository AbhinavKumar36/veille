# VEILLE v3.0: Final Project Report

## 1. Project Brief: The Layperson's Explanation
Imagine you have 10,000 police reports (FIRs), bank statements, and phone records (CDRs). A human detective would take years to read all of these, find connections, and figure out who the "boss" of a criminal network is.

**VEILLE** does this automatically. 
1. **It Reads:** It uses Artificial Intelligence (like ChatGPT) to read the messy police reports and extract the names of people, cars, and locations.
2. **It Connects:** It looks at the bank statements and phone records to see how these people are connected (e.g., "Person A called Person B").
3. **It Solves:** It puts all this information into a massive spider-web called a "Knowledge Graph." Then, it uses complex mathematics to find the center of the web—the people who have the most connections and control the flow of information. It ranks them with an "Investigation Priority" score and highlights them on a dashboard for the detective.

## 2. Project Review & Suggestions
The architectural transition from v2.0 (Conceptual) to v3.0 (Implementation) was highly successful. The modular design (separating NLP extraction from Neo4j analytics) is robust. 

**Suggestions for Future Iterations:**
- **Streaming Ingestion:** Currently, ingestion is batch-based via REST API. We should implement Kafka or RabbitMQ streams for real-time ingestion of phone logs.
- **Multi-Modal AI:** The current NLP engine reads text. Future versions should use OCR to read scanned documents and audio transcription for wiretaps.
- **Temporal Graphs:** Neo4j currently maps *what* happened, but not exactly *when* in a timeline view. Adding temporal graph algorithms would allow us to predict *future* criminal events.

## 3. Implementation Timeline (What was built)
Here is exactly what was implemented from the beginning until now:
- **Phase 1: Architecture Definition:** We established the 6-folder repository structure (`backend`, `frontend`, `graph`, `ml`, `infrastructure`, `synthetic_data`).
- **Phase 2: Infrastructure:** We built the `docker-compose.yml` to orchestrate Postgres, Neo4j, Redis, and MinIO.
- **Phase 3: Evaluation Engine:** We built mathematical grading scripts (`evaluator.py`) to score our AI's accuracy (Precision/Recall).
- **Phase 4: Database Schemas:** We defined relational tables (SQLAlchemy) and strict graph taxonomies (`schema.cypher`).
- **Phase 5: Ingestion API:** We built a FastAPI router (`ingestion.py`) to accept file uploads.
- **Phase 6: NLP Extraction:** We built `extractor.py` and strict Pydantic schemas to safely extract names and vehicles from text without hallucinating.
- **Phase 7: Entity Resolution:** We built `resolver.py` to mathematically merge duplicate identities (e.g., merging "Rajesh" and "Rajesh K.").
- **Phase 8: Graph Analytics:** We built `graph_algorithms.py` to calculate Degree Centrality and Shortest Paths to find the kingpins.
- **Phase 9: UI Dashboard:** We built a premium React application (`frontend/`) to visualize the priorities.

## 4. Shortcomings & Fixes
| Shortcoming | Impact | Engineering Fix |
| :--- | :--- | :--- |
| **Mock LLM Extraction** | The `extractor.py` currently returns hardcoded JSON for safety. | Integrate the official `google-genai` SDK and pipe the `IMPL_04_NLP_SPEC.md` prompt directly to Gemini 2.5 Pro. |
| **Local Dependencies** | Running Celery locally without Docker caused the pipeline to hang waiting for Redis. | Enforce that all development happens inside devcontainers or strictly require `docker compose up -d` before running Python scripts. |
| **UI Graph Placeholder** | The Neo4j graph is currently just a text box in the React dashboard. | Integrate `react-force-graph-2d` and pipe the nodes/edges from the backend API directly into the canvas. *(Fixing this in Phase 3 of current execution).* |
| **Lack of Authentication** | The FastAPI endpoints are open, meaning anyone can upload evidence. | Implement OAuth2 with JWT tokens in FastAPI and enforce Role-Based Access Control (RBAC) against the Postgres database. |
