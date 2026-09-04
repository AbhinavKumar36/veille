# 01 DATABASE SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Knowledge Engine / Application Engine

This specification details the PostgreSQL Entity-Relationship models. PostgreSQL acts as the **System of Record**. It does NOT store the graph; instead, it stores the highly structured, relational metadata required for case isolation, RBAC, and evidence auditability.

## 1. ER Schema Definition

### 1.1 `USERS`
Manages identity and Role-Based Access Control (RBAC).
*   `id`: UUID (Primary Key)
*   `email`: String (Unique)
*   `role`: String (Enum: `Investigator`, `Supervisor`, `Admin`, `Auditor`)
*   `is_active`: Boolean

### 1.2 `CASES`
Enforces Data Isolation. Every piece of evidence and every graph node belongs to a Case.
*   `id`: UUID (Primary Key)
*   `title`: String
*   `status`: String (Enum: `OPEN`, `CLOSED`, `ARCHIVED`)
*   `primary_investigator_id`: UUID (Foreign Key -> `USERS.id`)

### 1.3 `EVIDENCE`
The immutable record of uploaded intelligence (FIRs, CDRs, Financials).
*   `id`: UUID (Primary Key)
*   `case_id`: UUID (Foreign Key -> `CASES.id`)
*   `source_type`: String (Enum: `FIR`, `CDR`, `FINANCIAL`)
*   `file_path`: String (S3/MinIO bucket key)
*   `hash`: String (SHA-256 for Immutability Check)
*   `status`: String (Enum: `PROCESSING`, `COMPLETED`, `FAILED`)

### 1.4 `AUDIT_LOGS`
Immutable ledger of all actions affecting the graph or reading the graph.
*   `id`: UUID (Primary Key)
*   `created_at`: Timestamp
*   `actor_id`: UUID (Foreign Key -> `USERS.id`)
*   `action_type`: String (e.g., `MERGE_ENTITY`, `EXPORT_GRAPH`, `QUERY_GRAPH`)
*   `target_case_id`: UUID (Foreign Key -> `CASES.id`)

## 2. SQLAlchemy Implementation
These tables are implemented in `backend/db/models.py` using SQLAlchemy 2.0 paradigms (Declarative Base and Mapped types).
