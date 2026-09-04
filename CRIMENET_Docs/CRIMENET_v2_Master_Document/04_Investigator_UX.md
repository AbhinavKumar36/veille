# 6. Investigator UX & UI Workflows

VEILLE’s user interface is designed specifically for law enforcement professionals, prioritizing clarity, auditability, and speed. The UI avoids overwhelming the user with raw data by structuring interactions into distinct, logical workflows.

## 6.1 Core UI Workflows

The interface is built around a single, continuous investigator workflow:
**Case Workspace → Data Ingestion → Entity Review Queue → Network Explorer → Evidence Explorer → AI Assistant**

### 1. The Case Workspace
All data is strongly isolated within a "Case." When an investigator logs in, they select an active case. This defines the boundary for all subsequent searches and graph visualizations, ensuring that data from unrelated investigations does not pollute the current analytical context (unless explicitly cross-referenced).

### 2. The Entity Review Queue (Human-in-the-Loop)
Because AI predictions are not infallible (as stated in our Ethical Boundaries), VEILLE includes a mandatory human-in-the-loop step.
- When the Entity Resolution engine identifies a potential match with a confidence score between 0.60 and 0.89, it places it in the Review Queue.
- The UI presents a side-by-side comparison:
  - **Entity A:** "Rajesh K." (Source: FIR #102)
  - **Entity B:** "Rajesh Kumar" (Source: CDR Data)
- The investigator clicks **[Merge]** or **[Keep Separate]**.
- *Demo Value:* Showing this screen to the judges proves the system is designed for real-world messy data, not just perfect synthetic data.

### 3. The Network Explorer (Graph Visualization)
The flagship view of VEILLE. Built using libraries like Cytoscape.js or React Force Graph.
- **Visuals:** Nodes represent entities (People, Phones, etc.), edges represent relationships.
- **Interactions:**
  - **Click Node:** Opens a side-panel with entity details and a list of all source documents mentioning this entity.
  - **Click Edge:** Shows the confidence score of the relationship and a hyperlink to the exact sentence in the FIR/CDR that generated it (Evidence Provenance).
  - **Expand/Collapse:** Investigators can double-click a node to fetch its immediate neighbors (1-hop traversal), preventing the "hairball" problem of loading 10,000 nodes at once.
- **Blast Radius:** A feature that highlights all entities within N hops of a selected suspect, useful for identifying potential accomplices.

### 4. The RAG AI Assistant
A chat interface docked to the side of the screen.
- Investigators can ask natural language questions: *"Show me all financial transactions related to Rajesh's phone number between Jan 1st and Jan 5th."*
- The AI responds with text, but also manipulates the main Network Explorer to highlight the relevant nodes.

## 6.2 The Flagship Live Demo Flow (Presentation Strategy)

This specific flow is scripted to maximize impact during the 5-7 minute SIH judge presentation.

- **Scene 1 (The Blank Slate):** The investigator opens a case with an initially sparse network (e.g., just one known suspect).
- **Scene 2 (The Data Dump):** The investigator uploads 3 highly heterogeneous sources simultaneously: a scanned FIR PDF, a CSV of CDRs, and a CSV of bank transactions.
- **Scene 3 (The AI at Work):** A real-time toast notification system shows the AI pipeline in action: *Extracting Entities...* → *Resolving Identities...* → *Building Graph...*
- **Scene 4 (The Discovery):** The graph updates dynamically. Two initially separate clusters (one from the FIR, one from the financials) suddenly connect via a shared "Bridge Entity" (e.g., a shared accountant or a burner phone). This is the "Aha!" moment of the demo.

## 6.3 Example API Contracts

To ensure seamless integration between the React frontend and the FastAPI backend, we define strict API contracts.

### Fetch Node Details (REST)
```json
// GET /api/v1/cases/101/nodes/person-452
{
  "id": "person-452",
  "labels": ["Person"],
  "properties": {
    "name": "Rajesh Kumar",
    "aliases": ["Raju"],
    "risk_score": 85
  },
  "provenance": [
    {
      "evidence_id": "evd-992",
      "source_type": "FIR",
      "extracted_by": "NER_Model_v2",
      "confidence": 0.95
    }
  ]
}
```

### Fetch Shortest Path (REST)
```json
// GET /api/v1/cases/101/analysis/shortest-path?source=person-452&target=person-881
{
  "path_found": true,
  "hops": 2,
  "path": [
    {"type": "node", "id": "person-452", "name": "Rajesh Kumar"},
    {"type": "edge", "relation": "USES", "confidence": 0.99},
    {"type": "node", "id": "phone-112", "number": "+91-9876543210"},
    {"type": "edge", "relation": "CALLED", "confidence": 1.0},
    {"type": "node", "id": "person-881", "name": "Amit Singh"}
  ]
}
```
