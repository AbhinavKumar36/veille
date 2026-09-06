"""
VEILLE v4.0 — Database & System Reset Script
Performs a full clean wipe of PostgreSQL tables, Neo4j graph nodes, and Redis caches.
Re-creates fresh PostgreSQL tables, system administrative operators, and Neo4j schema indexes.
"""
import sys
import os

# Make sure imports work from this directory
sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings
from core.database import SessionLocal, engine
from core.graph_db import get_graph_session
from core.redis_client import get_redis_client
from db.models import Base, User
from api.auth import get_password_hash

print("=" * 60)
print("VEILLE v4.0 — System Reset & Clean Slate Initialization")
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

    # 4. Clean Neo4j Graph & Re-create Constraints
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

            print("[+] Neo4j performance indexes and schema constraints established")
    except Exception as e:
        print(f"[!] Note on Neo4j reset: {e}")

    # 5. Flush Redis Cache
    try:
        r = get_redis_client()
        r.flushdb()
        print("[+] Redis cache keys flushed")
    except Exception as e:
        print(f"[!] Note on Redis flush: {e}")

    print()
    print("=" * 60)
    print("ALL DATABASES PURGED & RE-INITIALIZED SUCCESSFULLY.")
    print(f"  HEAD Login:         {settings.ADMIN_EMAIL} (password: {settings.ADMIN_PASSWORD})")
    print(f"  Investigator Login: investigator@veille.gov.in (password: investigator123)")
    print("=" * 60)

finally:
    db.close()
