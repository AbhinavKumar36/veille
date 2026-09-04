# Layer 2: How We Build VEILLE

## 1. End-to-End System Architecture Pipeline

The system follows a layered, service-oriented architecture designed to decouple slow AI extraction tasks from the fast interactive graph UI. Each subsystem represents a distinct phase in the intelligence lifecycle.

### The Hybrid AI Philosophy
VEILLE does **not** route all tasks through a Large Language Model. We utilize a hybrid approach where each technology performs the job it is best suited for:
- **Deterministic Code:** API routing, Data Pipelines, and Role-Based Access Control (RBAC).
- **Natural Language Processing (NLP):** Entity extraction from unstructured text.
- **Statistical Machine Learning:** Entity resolution and confidence scoring.
- **Graph Algorithms:** Network analysis (centrality, community detection).
- **Large Language Models (LLM):** Investigator interaction (RAG) and human-readable explanation of evidence.

### 1.1 System Architecture Diagram

```mermaid
flowchart TD
    subgraph Investigator_UX ["Investigator UX"]
        UI[React Frontend]
        GraphVis[Network Explorer]
        AI_Chat[RAG Assistant]
    end

    subgraph API_Gateway ["API Gateway"]
        FastAPI["FastAPI / Node.js Router"]
        Auth[RBAC Middleware]
    end

    subgraph Storage_Layer ["Storage Layer"]
        PG[("PostgreSQL<br>System of Record")]
        Neo4j[("Neo4j<br>Knowledge Graph")]
        S3[("Object Storage<br>Raw Evidence")]
    end

    subgraph Async_Pipeline ["Async Pipeline"]
        Redis((Redis Queue))
        Celery_Worker[Celery Worker<br>NLP & Extraction]
        Outbox_Processor[Outbox Processor]
    end

    UI --> |REST / WSS| FastAPI
    FastAPI --> Auth
    Auth --> PG
    Auth --> Neo4j
    Auth --> S3
    Auth --> |Publish Job| Redis
    
    Redis --> |Consume| Celery_Worker
    Celery_Worker --> |Write to Outbox| PG
    Outbox_Processor --> |Read Outbox| PG
    Outbox_Processor --> |Resolved Edges| Neo4j
```

## 2. Data Ingestion Architecture

Data ingestion is the system's most critical chokepoint. VEILLE uses strongly-typed ingestion pathways depending on the source material to prevent "garbage-in, garbage-out" scenarios.

### 2.1 Structured Data Ingestion (CDRs, Financials)
Structured data provides high-fidelity, explicit relationships but lacks context.
- **Process:** User uploads a CSV of Call Detail Records (CDRs).
- **Validation:** The system maps the CSV columns to the expected schema (Caller, Receiver, Timestamp, Duration, Cell Tower ID).
- **Extraction:** This bypasses the heavy NLP worker. It goes directly to the Entity Resolution engine.
- **Result:** Creates `COMMUNICATES_WITH` edges with high Extraction Confidence.

### 2.2 Unstructured Data Ingestion (FIRs, Reports)
Unstructured data provides rich context but requires probabilistic extraction.
- **Process:** User uploads a scanned PDF FIR.
- **OCR Phase:** If the PDF is an image, it is routed through an OCR engine (e.g., Tesseract or Cloud Vision).
- **NLP Phase:** Text is passed to a specialized NLP model (e.g., a custom spaCy pipeline or fine-tuned Transformer).
- **Candidate Generation:** The model identifies entities (e.g., "Rajesh Kumar") and syntactic relationships.
- **Result:** Emits "candidate edges" with varying Extraction Confidence based on the model's certainty.

### 2.3 The Ingestion Sequence Diagram

The following diagram details the exact asynchronous technical flow from the moment an investigator clicks "Upload" to the moment the graph updates.

```mermaid
sequenceDiagram
    participant UI as "Investigator UX"
    participant API as "Gateway / API"
    participant PG as "PostgreSQL (RDBMS)"
    participant S3 as "Object Storage (MinIO/S3)"
    participant Redis as "Job Queue"
    participant Celery as "Celery Worker"
    participant Outbox as "Outbox Processor"
    participant Graph as "Neo4j (Knowledge Graph)"

    UI->>API: Upload Evidence (FIR.pdf)
    API->>S3: Save File (Immutable)
    S3-->>API: Returns file_path
    API->>PG: Insert Evidence Record (status: 'processing')
    PG-->>API: Returns evidence_id
    API->>Redis: Publish Celery Task {evidence_id}
    API-->>UI: Return 202 Accepted (job_id)
    
    Note over UI,API: UI polls /evidence/status/{id}
    
    Redis->>Celery: Consume Task
    Celery->>S3: Retrieve FIR.pdf text
    Celery->>Celery: Run NER & Relationship Extraction
    Celery->>PG: Write Candidate Graph to Outbox (PG)
    Celery->>PG: Update Evidence Record (status: 'completed')
    
    loop Every 2 Seconds
        Outbox->>PG: Read Outbox Events
        Outbox->>Outbox: Run Entity Resolution
        alt Confidence > Threshold
            Outbox->>Graph: Upsert Nodes and Edges
            Outbox->>PG: Mark Event Processed
        else Confidence is Ambiguous
            Outbox->>PG: Flag for Human Review Queue
        end
    end
```

### 2.4 Failure Paths and the Dead Letter Queue (DLQ)
To prevent the system from entering a broken state, the asynchronous pipeline implements a Dead Letter Queue (DLQ) in Redis.
- If the OCR fails, or the NLP worker crashes on a malformed document, the job is moved to the DLQ.
- The PostgreSQL `evidence` record is marked `status: 'failed'`.
- The UI alerts the investigator, allowing them to manually review the document. No corrupted or partial data reaches Neo4j.
