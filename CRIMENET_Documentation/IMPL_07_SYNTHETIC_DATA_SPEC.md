# 07 SYNTHETIC DATA SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Proof Engine

This specification dictates the implementation of the `synthetic_data/` pipeline. This is **Step 1** of the VEILLE build order. The goal is to generate a measurable mathematical benchmark against which the entire intelligence pipeline will be evaluated.

## 1. Directory Structure
```text
VEILLE_Codebase/synthetic_data/
├── ground_truth/
│   ├── generate_ground_truth.py
│   └── outputs/
│       ├── entities.json
│       └── relationships.json
├── generators/
│   ├── generate_documents.py
│   └── outputs/
│       ├── firdocs/ (PDFs/TXT)
│       └── cdrs/ (CSVs)
└── noise/
    └── noise_injector.py
```

## 2. Component 1: `generate_ground_truth.py`
This script must autonomously generate the "Answer Key."
- **Target Count:** 50 distinct Entities (Person, Phone, Location, Vehicle, Organization).
- **Target Edges:** 73 distinct Relationships matching the canonical ontology (`USES`, `OWNS`, `AFFILIATED_WITH`, `COMMUNICATES_WITH`, `PARTICIPATED_IN`).
- **Topology:** The graph must not be random. It must consist of two dense clusters (e.g., a "Smuggling Ring" and a "Money Laundering Cell") connected by exactly 1 or 2 "Bridge Entities" (e.g., a shared accountant or a shared burner phone).

### Output Format (`entities.json`):
```json
[
  {
    "id": "person_001",
    "type": "Person",
    "name": "Rajesh Kumar",
    "aliases": ["Raju"],
    "dob": "1985-04-12"
  }
]
```

### Output Format (`relationships.json`):
```json
[
  {
    "source_id": "person_001",
    "target_id": "phone_001",
    "type": "USES"
  }
]
```

## 3. Component 2: `generate_documents.py` & `noise_injector.py`
This script takes the clean `ground_truth` and translates it into the messy, noisy formats that police actually use.

### 3.1 Unstructured FIR Generation
- Use a templating engine (or an LLM call) to generate narrative text summarizing the events that link the entities.
- e.g., "On the night of 12th April, Raju (known associate of the Singh gang) was seen driving a white Honda (DL-4C-1234)."
- **Noise Injection Parameters:**
  - `p_typo = 0.15`: Introduce typos into names (e.g., "Rajesh" -> "Rjesh").
  - `p_red_herring = 0.20`: Inject random names completely unconnected to the true graph to test if the NLP engine correctly ignores them.

### 3.2 Structured CDR Generation
- Generate CSVs representing Call Detail Records.
- Ensure the `COMMUNICATES_WITH` relationships from the ground truth manifest as thousands of rows of individual calls between the respective `Phone` nodes.
- **Noise Injection Parameters:**
  - `p_missing_tower = 0.10`: Leave the `cell_tower_id` blank for some rows.
  - `p_burner_phone = 0.05`: Have a known entity suddenly use an unknown phone number not in the ground truth, testing the ER engine's ability to cluster by location/time instead of identity.

## 4. Execution Command
The final deliverable for this milestone must be executable via:
```bash
python -m synthetic_data.ground_truth.generate_ground_truth
python -m synthetic_data.generators.generate_documents
```

Upon execution, the outputs must be visually verifiable in the `outputs/` directories.
