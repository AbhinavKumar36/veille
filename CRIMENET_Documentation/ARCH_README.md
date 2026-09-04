# VEILLE v2.1 / Engineering Finalization

This directory contains the canonical technical blueprint for **VEILLE AI**, a multisource intelligence fusion and relationship-analysis system developed for the SIH26189 problem statement.

This version (v2.1) transitions the project from a conceptual specification into a rigorous, implementation-ready engineering contract. It establishes the canonical ontology, a multi-layered confidence model, robust security architectures, and a first-class synthetic data evaluation pipeline.

## Document Index

The blueprint is structured into three distinct layers to provide a natural narrative flow from Problem to Proof.

### Layer 1: Why
*Understanding the problem, our ethical boundaries, and why we are building this.*
1. **[01_Problem_and_Vision.md](./01_Problem_and_Vision.md)**
   - Fragmentation vs. Lack of Data
   - Multisource Intelligence Fusion
   - Explicit Ethical Boundaries & Non-claims

### Layer 2: How
*The architecture, schemas, pipelines, and security mechanisms that make it work.*
2. **[02_System_Architecture.md](./02_System_Architecture.md)**
   - System Architecture Diagram
   - Ingestion Pathways (Structured/Unstructured)
   - Asynchronous Pipeline & Dead Letter Queue
3. **[03_Knowledge_Graph_and_Data.md](./03_Knowledge_Graph_and_Data.md)**
   - The Canonical Ontology (Observed vs. Inferred)
   - The 5-Layer Confidence Model
   - PostgreSQL ER Model & Neo4j Ontology
4. **[04_Security_and_Privacy.md](./04_Security_and_Privacy.md)**
   - Security Boundary Architecture Diagram
   - Auth, Token Lifecycle, API Middleware
   - Threat Models (Prompt Injection, Chain of Custody)
5. **[05_API_and_UX.md](./05_API_and_UX.md)**
   - Investigator UX Workflows (State Diagram)
   - Canonical API Contracts (incorporating `investigation_priority`)

### Layer 3: Prove It
*How we demonstrate to the judges that the AI actually works.*
6. **[06_Synthetic_Data_and_Evaluation.md](./06_Synthetic_Data_and_Evaluation.md)**
   - The Evaluation Pipeline Diagram
   - Ground-Truth Generation & Noise Injection
   - Precision/Recall Metrics for AI Proof
7. **[07_Execution_and_Roadmap.md](./07_Execution_and_Roadmap.md)**
   - The Implementation Contract (MVP vs. Mocked)
   - The 4-Scene Flagship Demo Flow
   - Team Allocation & Build Roadmap

---
*Generated as a structured Markdown project. Ready for technical implementation.*
