# 5. AI / ML Intelligence Engine

The VEILLE AI engine is a multi-stage pipeline of purpose-built components. The governing design principle is: **"Not every problem should be solved with an LLM."**

## 5.1 Natural Language Processing (NER & Relationship Extraction)
The first challenge is extracting structured data from unstructured police notes and FIRs.
- **Technology:** Custom-trained or fine-tuned Transformer models (e.g., RoBERTa-based models fine-tuned on legal/police domain text).
- **Function:** 
  1. Identifies Named Entities (Person, Location, Organization, Vehicle Registration, Phone Number).
  2. Extracts Syntactic Relationships between these entities (e.g., identifying that "Rajesh" is the owner of "DL-4C-1234").
- **Output:** A JSON array of "candidate nodes" and "candidate edges," each with an extraction confidence score.

## 5.2 Entity Resolution (ER) Engine
This is the most mathematically rigorous and important component of VEILLE. When the NLP engine finds a "R. Kumar" in an FIR, and a CSV upload contains a "Rajesh Kumar", the system must decide if they are the same person.

- **Mechanism:** The ER engine uses a combination of techniques:
  - **String Distance (Jaro-Winkler, Levenshtein):** For fuzzy matching names and addresses.
  - **Graph Proximity:** If "R. Kumar" and "Rajesh Kumar" share a connection to the same phone number or address in the graph, the confidence that they are the same person increases exponentially.
- **Thresholding:**
  - `Confidence > 0.90`: Automatic Merge.
  - `Confidence 0.60 - 0.89`: Sent to the **Investigator Review Queue** for human confirmation.
  - `Confidence < 0.60`: Treated as separate entities.

## 5.3 Graph Analytics Engine
Once the data is resolved in Neo4j, the Graph Analytics Engine runs asynchronously to detect patterns that are mathematically impossible for a human to see in a spreadsheet.

| Algorithm | Investigative Purpose |
| :--- | :--- |
| **Betweenness Centrality** | Finds the "brokers" or "bridges" between different criminal clusters. High betweenness often indicates a money launderer or a weapons supplier shared by two distinct gangs. |
| **PageRank / Eigenvector** | Finds the most influential individuals within a network based on who they are connected to, not just how many connections they have. |
| **Louvain Community Detection** | Automatically groups nodes into "syndicates" or "cells" based on the density of their internal communications compared to external ones. |
| **Triadic Closure / Motif Detection** | Looks for specific shapes in the graph. For example, if A transfers money to B, and B transfers money to C, a triadic closure algorithm predicts a hidden relationship between A and C. |

## 5.4 Temporal & Geospatial Engines (Stretch Scope)
- **Temporal Engine:** Analyzes time-series data (e.g., CDR timestamps) to detect "bursts" of activity. For example, detecting that three suspects who never usually speak all called each other within a 10-minute window before a known crime event.
- **Geospatial Engine:** Uses PostGIS or Neo4j Spatial to cluster locations. It can detect if two nominally unrelated suspects frequently ping cell towers in the same 100-meter radius at the same time (co-location).

## 5.5 Retrieval-Augmented Generation (RAG) Assistant
The LLM is deployed solely as an interface and reasoning engine over the *existing* graph and evidence base, not as a source of truth.

- **Query:** "Who is the main supplier of vehicles to Rajesh's network?"
- **Process:** 
  1. The query is converted into a Cypher query (GraphRAG) or a vector search over the evidence documents.
  2. The results (subgraphs and document chunks) are injected into the LLM prompt.
  3. The LLM synthesizes a natural language answer.
- **Guardrails:** The LLM is strictly prompted to refuse answering questions where the context does not contain the answer, effectively mitigating hallucinations. Every claim it makes must include a citation link to the specific FIR or CDR row that provided the information.

## 5.6 Evaluation Methodology & Metrics
To prove the AI actually works, we evaluate it against our Synthetic Ground-Truth Dataset (see Section 9).

- **Entity Resolution Evaluation:** Measured using **F1-Score** on the synthetic graph's node merges. (Precision: Did we merge incorrectly? Recall: Did we miss a merge?).
- **Relationship Extraction Evaluation:** Measured by comparing the extracted edges from unstructured text against the hidden "answer key" of the synthetic data.
- **RAG Hallucination Rate:** Measured by automated tests checking if the LLM output contains any entities NOT present in the retrieved context.
