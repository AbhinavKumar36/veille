# 02 NEO4J SCHEMA SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Knowledge Engine

This specification defines the canonical Neo4j node and edge constraints and the initialization Cypher scripts. Neo4j acts as the **Knowledge Graph**, storing the entities and relationships extracted from the Evidence.

## 1. Node Constraints and Indices

To ensure data integrity and query performance, we enforce strict constraints on the Canonical Node types defined in the taxonomy. Every node MUST possess an `id`.

*   **Person**: `CREATE CONSTRAINT person_id IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE;`
*   **Phone**: `CREATE CONSTRAINT phone_id IF NOT EXISTS FOR (n:Phone) REQUIRE n.id IS UNIQUE;`
*   **Account**: `CREATE CONSTRAINT account_id IF NOT EXISTS FOR (n:Account) REQUIRE n.id IS UNIQUE;`
*   **Vehicle**: `CREATE CONSTRAINT vehicle_id IF NOT EXISTS FOR (n:Vehicle) REQUIRE n.id IS UNIQUE;`
*   **Organization**: `CREATE CONSTRAINT org_id IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE;`
*   **Location**: `CREATE CONSTRAINT loc_id IF NOT EXISTS FOR (n:Location) REQUIRE n.id IS UNIQUE;`
*   **Event**: `CREATE CONSTRAINT event_id IF NOT EXISTS FOR (n:Event) REQUIRE n.id IS UNIQUE;`

**Full-Text Indices:**
For rapid entity search in the Network Explorer:
*   `CREATE FULLTEXT INDEX person_name IF NOT EXISTS FOR (n:Person) ON EACH [n.name, n.aliases];`
*   `CREATE INDEX phone_number IF NOT EXISTS FOR (n:Phone) ON (n.number);`

## 2. Multi-Tenancy (Case Isolation)

Neo4j does not natively support row-level security in the Community Edition. Therefore, isolation is enforced at the schema level:
*   **Every Node** must have a `case_id` property.
*   **Every Edge** must have a `case_id` property.

This ensures queries from the API Gateway always implicitly inject `WHERE n.case_id = $current_case`.

## 3. Evidence Provenance

Every relationship (Edge) in Neo4j must contain the following metadata properties linking it back to the PostgreSQL `EVIDENCE` table:
*   `source_evidence_id`: The ID from PostgreSQL.
*   `extraction_confidence`: The L1 confidence from the NLP pipeline.
*   `is_inferred`: Boolean (`True` for `ASSOCIATED_WITH`, `False` for explicit links like `COMMUNICATES_WITH`).
