// VEILLE v3.0 - Neo4j Canonical Schema Initialization

// 1. UNIQUE Constraints
// Enforces that every canonical entity type has a unique identifier
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT phone_id IF NOT EXISTS FOR (n:Phone) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT account_id IF NOT EXISTS FOR (n:Account) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT vehicle_id IF NOT EXISTS FOR (n:Vehicle) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT org_id IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT loc_id IF NOT EXISTS FOR (n:Location) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT event_id IF NOT EXISTS FOR (n:Event) REQUIRE n.id IS UNIQUE;

// 2. Property Indices
// Enforces fast lookup for exact matches
CREATE INDEX phone_number IF NOT EXISTS FOR (n:Phone) ON (n.number);
CREATE INDEX account_number IF NOT EXISTS FOR (n:Account) ON (n.number);
CREATE INDEX vehicle_plate IF NOT EXISTS FOR (n:Vehicle) ON (n.plate);

// 3. Full-Text Search Indices
// Enforces fast fuzzy lookup for the React Network Explorer UI
CREATE FULLTEXT INDEX person_name IF NOT EXISTS FOR (n:Person) ON EACH [n.name, n.aliases];
CREATE FULLTEXT INDEX org_name IF NOT EXISTS FOR (n:Organization) ON EACH [n.name];
CREATE FULLTEXT INDEX loc_address IF NOT EXISTS FOR (n:Location) ON EACH [n.address];
CREATE FULLTEXT INDEX event_name IF NOT EXISTS FOR (n:Event) ON EACH [n.name];

// 4. Case Isolation Index
// Optimizes the implicit WHERE n.case_id = $current_case filter
CREATE INDEX person_case_id IF NOT EXISTS FOR (n:Person) ON (n.case_id);
CREATE INDEX phone_case_id IF NOT EXISTS FOR (n:Phone) ON (n.case_id);
