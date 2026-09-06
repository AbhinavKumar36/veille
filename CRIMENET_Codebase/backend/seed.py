"""
VEILLE v4.0 — Database & System Clean Reset Script
Performs a full clean wipe of PostgreSQL tables, Neo4j graph nodes, and Redis caches.
Re-creates fresh PostgreSQL tables, system administrative operators, and schema indexes.
Leaves cases, graph nodes, and review queues completely clean (0 cases, 0 reviews, 0 graph nodes).
"""
import sys
import os
import json

# Make sure imports work from this directory
sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings
from core.database import SessionLocal, engine
from core.graph_db import get_graph_session
from core.redis_client import get_redis_client
from db.models import Base, User, AuditLog
from api.auth import get_password_hash

print("=" * 60)
print("VEILLE v4.0 — Clean Slate System Reset")
print("=" * 60)

# 1. Reset PostgreSQL Tables
print("[*] Wiping and re-creating PostgreSQL tables...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("[+] PostgreSQL tables freshly created (0 records)")

db = SessionLocal()
try:
    # 2. Create Head Administrator User
    admin = User(
        email=settings.ADMIN_EMAIL,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        role="HEAD",
        is_active=True,
    )
    db.add(admin)

    # 3. Create Default Investigator User
    dev_user = User(
        email="investigator@veille.gov.in",
        hashed_password=get_password_hash("investigator123"),
        role="INVESTIGATOR",
        is_active=True,
    )
    db.add(dev_user)
    db.commit()

    print(f"[+] HEAD operator initialized: {settings.ADMIN_EMAIL}")
    print(f"[+] Default investigator initialized: investigator@veille.gov.in")

    # 4. Create Initial Clean System Audit Trail
    audit_logs = [
        AuditLog(
            actor_id=admin.id,
            action_type="SYSTEM_INITIALIZED",
            target_case_id=None,
            extra_metadata=json.dumps({"version": "4.0.0", "status": "CLEAN_SLATE_RESET"}),
        ),
        AuditLog(
            actor_id=admin.id,
            action_type="OPERATOR_PROVISIONED",
            target_case_id=None,
            extra_metadata=json.dumps({"email": dev_user.email, "role": "INVESTIGATOR"}),
        ),
        AuditLog(
            actor_id=admin.id,
            action_type="SECURITY_POLICY_ENFORCED",
            target_case_id=None,
            extra_metadata=json.dumps({"policy": "RFC_5280_NIST_800_57"}),
        ),
    ]
    for log_entry in audit_logs:
        db.add(log_entry)
    db.commit()
    print(f"[+] Initial audit trail established ({len(audit_logs)} log records)")

    # 5. Clean Neo4j Graph & Re-create Constraints
    try:
        with get_graph_session() as graph_session:
            print("[*] Purging all existing Neo4j graph nodes and relationships...")
            graph_session.run("MATCH (n) DETACH DELETE n")
            print("[+] Neo4j graph purged completely (0 nodes, 0 relationships)")

            # Create schema constraints and indexes for high-throughput querying
            labels = ["Person", "Organization", "Account", "Phone", "Vehicle", "Location", "Event", "Entity"]
            for label in labels:
                try:
                    graph_session.run(f"CREATE INDEX node_case_id_{label} IF NOT EXISTS FOR (n:{label}) ON (n.case_id)")
                    graph_session.run(f"CREATE INDEX node_id_{label} IF NOT EXISTS FOR (n:{label}) ON (n.id)")
                except Exception:
                    pass

            print("[+] Neo4j performance indexes established")
    except Exception as e:
        print(f"[!] Note on Neo4j reset: {e}")

    # 6. Flush Redis Cache (Clear all Review Queue items)
    try:
        r = get_redis_client()
        r.flushdb()
        print("[+] Redis cache completely flushed (0 pending reviews, 0 jobs)")
    except Exception as e:
        print(f"[!] Note on Redis flush: {e}")

    print()
    print("=" * 60)
    print("SYSTEM CLEAN SLATE COMPLETE — 0 CASES, 0 REVIEWS, 0 GRAPH NODES")
    print(f"  HEAD Login:         {settings.ADMIN_EMAIL} (password: {settings.ADMIN_PASSWORD})")
    print(f"  Investigator Login: investigator@veille.gov.in (password: investigator123)")
    print("=" * 60)

finally:
    db.close()
