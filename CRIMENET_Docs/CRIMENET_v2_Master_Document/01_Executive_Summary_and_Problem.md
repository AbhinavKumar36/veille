# VEILLE v2.0 Master Document

## 1. Executive Summary

VEILLE AI is an advanced, AI-powered Criminal Network Intelligence & Analysis System designed specifically for the complex data environments faced by modern law enforcement. It addresses the critical challenge of fragmented, heterogeneous investigation data—such as First Information Reports (FIRs), Call Detail Records (CDRs), financial transactions, surveillance reports, and social media intelligence. 

Instead of relying on manual synthesis or simplistic keyword searches, VEILLE ingests this raw, unstructured, and semi-structured data, and orchestrates it into a highly structured, queryable **Criminal Intelligence Knowledge Graph**.

It is built fundamentally as an **AI-assisted decision-support tool**, not an autonomous decision-maker. It surfaces hidden relationships, identifies key players, and highlights suspicious patterns, all while maintaining strict evidentiary provenance.

### 1.1 The Core Principle: The Processing Pipeline
VEILLE differentiates itself from naive "Upload -> Generate Graph" prototypes by adhering strictly to a phased processing pipeline:

**Extract → Reconcile → Connect → Analyze → Explain → Assist**

1. **Extract:** Purpose-built Natural Language Processing (NLP) models extract entities (People, Locations, Vehicles, Accounts) from unstructured text.
2. **Reconcile:** An advanced Entity Resolution engine performs confidence-scored deduplication, identifying when "John D." in an FIR is the same entity as the owner of a phone number in a CDR.
3. **Connect:** Extracted relationships are formalized as graph edges, complete with metadata tracking the origin of the connection.
4. **Analyze:** Graph algorithms (centrality, community detection, shortest path) calculate the structural importance of entities within the network.
5. **Explain:** Every relationship and claim made by the system is visually linked back to its source document.
6. **Assist:** The final output is presented to the investigator through an interactive Network Explorer and a Retrieval-Augmented Generation (RAG) assistant for natural language querying over the case facts.

### 1.2 The Hybrid AI Philosophy
VEILLE avoids the common pitfall of over-relying on Large Language Models (LLMs) for tasks they are poorly suited for. Instead, it utilizes a hybrid approach:
- Deterministic code handles data pipelines and role-based access control.
- Specialized NLP models handle entity extraction.
- Statistical Machine Learning handles entity resolution.
- Graph algorithms handle network analytics.
- The LLM is reserved exclusively for the interaction layer (RAG Q&A) and for generating human-readable explanations of complex, evidence-grounded data.

---

## 2. The Problem & SIH Alignment

### 2.1 Problem Statement Alignment
**SIH26189**: AI-Powered Criminal Network Analysis System
**Organization**: Ministry of Home Affairs, Government of India
**Theme**: Software — Blockchain & Cybersecurity

### 2.2 The Real-World Challenge: Fragmentation, Not Lack of Data
Modern investigations are rarely blocked by a lack of information; they are stymied by data fragmentation. Case-relevant information is scattered across completely different formats:
- **FIRs and Police Notes:** Unstructured, narrative text containing aliases, locations, and loose associations.
- **Call Detail Records (CDRs):** Highly structured, massive-volume CSVs linking phones, timestamps, and cell tower locations.
- **Financial Transactions:** Tabular data linking bank accounts to entities and timeframes.

Investigators are forced to act as manual data integrators, attempting to stitch together relationships between entities that appear inconsistently across these disparate sources. This manual cognitive load prevents them from seeing the broader network topology until much later in an investigation.

### 2.3 The Core Entities
To solve this, VEILLE standardizes investigations around a universal ontology. The system tracks the following primary entities:
- `Person`
- `Phone Number`
- `Vehicle`
- `Bank Account`
- `Location`
- `Organization`
- `Event`
- `Case`

### 2.4 Why This is a Fusion Problem
SIH26189 is frequently misunderstood as a simple data visualization problem. In reality, it is a **multisource intelligence fusion and relationship-analysis problem**. Drawing a graph on a screen is the trivial output step. The actual engineering challenge—and VEILLE's primary focus—is getting clean, resolved, and evidence-linked entities and relationships into that graph in the first place, automatically.

---

## 3. Product Vision & Explicit Boundaries

### 3.1 The Product Vision
VEILLE AI is positioned as:
> *"A decision-support and intelligence-discovery system that helps authorized investigators understand complex networks while preserving evidence provenance and strict human oversight."*

### 3.2 What We Will NOT Claim (Ethical & Legal Guardrails)
For an MHA-sponsored, civil-liberties-adjacent problem statement, maintaining strict ethical boundaries is not just a policy—it is a functional requirement. To build trust with investigators and the judiciary, VEILLE explicitly refuses to make the following claims:

1. **That AI can determine guilt.** Guilt is a legal conclusion reached by a court, not an algorithm.
2. **That graph centrality equates to criminality.** A high "betweenness centrality" score only means an entity connects disparate parts of a network; it does not prove they are a criminal mastermind. (e.g., A shared lawyer or accountant might be highly central but completely innocent).
3. **That an association automatically implies complicity.** A shared address or a phone call does not automatically imply a criminal conspiracy.
4. **That AI predictions are infallible.** The system acknowledges the possibility of false positives in entity resolution and relationship extraction.
5. **That every detected relationship is genuine.** The system surface *candidate* relationships for investigator review; it does not treat them as unassailable facts.
6. **That the system replaces investigators.** VEILLE is an exoskeleton for the investigator's mind, accelerating their workflow, not automating their job.
7. **That the system can autonomously make enforcement decisions.** The system will never automatically generate a warrant or flag an individual for arrest.

By hardcoding these boundaries into the architecture (via confidence scores, human-in-the-loop review queues, and mandatory evidence provenance), VEILLE presents a highly mature, realistic, and defensible solution to SIH26189.
