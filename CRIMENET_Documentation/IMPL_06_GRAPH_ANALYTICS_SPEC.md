# 06 GRAPH ANALYTICS SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Intelligence Engine

This specification defines the Neo4j Cypher algorithms used to automatically calculate the "Investigation Priority" of nodes within the Knowledge Graph. 

## 1. Algorithmic Objectives

VEILLE does not predict guilt; it predicts relevance. We use graph topology to identify individuals who sit at the center of criminal networks.

### 1.1 Degree Centrality (The "Hub" Score)
We calculate the number of unique connections an entity possesses, weighted by the confidence of those connections.
- A person linked to 5 phones, 3 bank accounts, and 12 other suspects will have a massive centrality score.
- **Cypher Mechanism:** We use `apoc.algo.degree` or native `COUNT(edges)` bounded by `case_id`.

### 1.2 Betweenness Centrality (The "Broker" Score)
We identify nodes that act as bridges between otherwise disconnected clusters (e.g., a money launderer connecting two separate gangs).
- **Cypher Mechanism:** Using the Neo4j Graph Data Science (GDS) library: `gds.betweenness.stream()`.

### 1.3 Shortest Path (Dijkstra)
When an investigator queries two suspects, the system must find the shortest evidence-backed chain connecting them.
- **Cypher Mechanism:** `MATCH p=shortestPath((a:Person)-[*]-(b:Person)) RETURN p`

## 2. The Investigation Priority Formula

The final score surfaced to the React UI is a composite scalar between 0.0 and 1.0.

$$ Priority = \min(1.0, \frac{W_1(Degree) + W_2(Betweenness)}{Normalization Factor}) $$

*Note: In the initial mock/MVP, we heavily weight Degree Centrality as it is the most computationally efficient to update dynamically.*

## 3. Asynchronous Recalculation

Graph analytics are computationally expensive. We do not calculate them on-the-fly when the UI loads. Instead, the `graph_analytics_task` Celery worker fires after every new batch of evidence is successfully resolved into the graph. It calculates the scores in the background and writes the `investigation_priority` property directly onto the Neo4j nodes.
