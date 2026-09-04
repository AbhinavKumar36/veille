# 8. Security & Privacy Architecture

Law enforcement systems are high-value targets. Data leaks or unauthorized access can compromise active investigations and violate civil liberties.

## 8.1 Role-Based Access Control (RBAC)
Access to VEILLE is strictly governed by roles defined in the PostgreSQL database.

| Role | Permissions |
| :--- | :--- |
| **Investigator** | Can create cases, upload evidence, and query graphs *only within assigned cases*. |
| **Supervisor** | Can view all cases within their precinct/division. Can approve Cross-Case Analysis requests. |
| **System Admin** | Can manage users and system health, but *cannot* view case evidence or graph data. |
| **Auditor** | Read-only access specifically to the `audit_logs` table to ensure compliance. |

## 8.2 Audit Logging
Who searched for what is just as important as the data itself.
- Every API request that reads from or writes to the graph generates an immutable log entry in PostgreSQL.
- **Logged fields:** `timestamp`, `actor_id`, `action_type` (e.g., "QUERY_GRAPH", "UPLOAD_EVIDENCE", "MERGE_ENTITY"), `target_case_id`, `ip_address`.
- This ensures that if a user searches for a politician or celebrity not relevant to their case, the query is recorded and flaggable.

## 8.3 Data Encryption
- **In Transit:** TLS 1.3 enforced for all API and WebSocket traffic.
- **At Rest:** 
  - Object Storage (S3/MinIO) uses AES-256 encryption.
  - PostgreSQL and Neo4j data directories are hosted on encrypted volumes (LUKS/EBS).

---

# 9. Synthetic Dataset Strategy

The SIH judging criteria heavily weigh whether the solution actually works or is just a UI mock-up. The **Synthetic Dataset Generator** is our proof-of-concept engine. It proves that our Entity Resolution and Relationship Extraction pipelines function correctly on noisy data.

## 9.1 Ground-Truth Generator Design
1. **The Answer Key:** We hand-author a 'true' network of 50 entities (e.g., a smuggling ring with two clusters bridged by a single corrupt logistics manager).
2. **Document Generation:** A Python script generates realistic-looking source documents (FIR text, CDR CSVs, Financial CSVs) that describe this true network.
3. **Noise Injection (Crucial Step):** The script deliberately injects real-world messiness:
   - *Typographical:* "Rajesh Kumar" vs "Raju Kumar".
   - *Missing Data:* A CDR entry missing a cell tower ID.
   - *Duplicate Entities:* Two different people sharing the same name but having different phone numbers.
   - *Red Herrings:* Adding random, unconnected individuals to the FIR text.

## 9.2 Why This is the Winning Strategy
Competitors will likely hardcode a perfect graph into Neo4j. By generating noisy source documents, pushing them through our NLP pipeline, and letting the UI *visibly resolve* the noise back into the "true" network, we demonstrate actual AI intelligence. 

## 9.3 Evaluation
Because we have the "Answer Key" generated in Step 1, we can mathematically evaluate the system:
- Did the Entity Resolution engine merge the two "Rajesh" nodes? (True Positive)
- Did it accidentally merge two different people named "Amit"? (False Positive)
- Did the NLP engine find the `COMMUNICATES_WITH` link hidden in paragraph 3 of the FIR?
