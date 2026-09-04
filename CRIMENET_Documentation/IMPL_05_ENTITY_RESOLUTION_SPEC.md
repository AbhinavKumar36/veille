# 05 ENTITY RESOLUTION SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Intelligence Engine

This specification defines the algorithmic approach for Entity Resolution (ER), which deduplicates extracted entities against the existing Knowledge Graph.

## 1. Resolution Strategy

VEILLE uses a **Hybrid Entity Resolution Model** combining Lexical (string) similarity and Structural (graph) similarity.

### 1.1 Lexical Similarity (Jaro-Winkler)
Used primarily for `Person` and `Organization` names to handle typos and abbreviations (e.g., "Rajesh Kumar" vs "Rajesh K.").
- Jaro-Winkler heavily weights prefixes, making it ideal for human names.
- We use the `jellyfish` library to calculate the JW distance.

### 1.2 Exact Match
Used for strongly identifying properties:
- `Phone.number`
- `Account.number`
- `Vehicle.plate`
If these exactly match, the entities are considered a 1.0 confidence match.

### 1.3 Structural Similarity (Graph Proximity)
If two Person nodes share an edge with the exact same Phone node or Address node, their similarity score receives a massive $+0.4$ boost.

## 2. Confidence Thresholds & Actions

The resolver calculates a final scalar Confidence Score $C \in [0, 1]$.

| Confidence ($C$) | Action Taken |
| :--- | :--- |
| $C \ge 0.90$ | **Auto-Merge**: The candidate node is automatically merged into the existing Neo4j node. |
| $0.70 \le C < 0.90$ | **Human Review**: Both nodes exist, but an `AMBIGUOUS_MATCH` edge is drawn between them, placing them in the React UI Review Queue. |
| $C < 0.70$ | **Create New**: The candidate is safely assumed to be a distinct new entity and is inserted into Neo4j. |

## 3. Review Queue Mechanism
When an investigator resolves a queue item in the UI, the API triggers a backend Cypher transaction to either execute an `apoc.refactor.mergeNodes` or delete the `AMBIGUOUS_MATCH` edge.
