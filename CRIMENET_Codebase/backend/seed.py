"""
VEILLE v4.0 — Database & Knowledge Graph Seed Script
Seeds initial admin user, dev investigator, demo cases, and Neo4j intelligence graph.
"""
import sys
import os
import uuid

# Make sure imports work from this directory
sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings
from core.database import SessionLocal, engine
from core.graph_db import get_graph_session
from db.models import Base, User, Case
from api.auth import get_password_hash

print("=" * 60)
print("VEILLE v4.0 — Database & Graph Seed Script")
print("=" * 60)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)
print("[+] Tables created (or already exist)")

db = SessionLocal()
try:
    # ── Create Admin User ────────────────────────────────────────────────
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[+] Admin user created: {settings.ADMIN_EMAIL}")
    else:
        print(f"[*] Admin user already exists: {settings.ADMIN_EMAIL}")

    # ── Create Sample Investigator (dev only) ────────────────────────────
    dev_user = db.query(User).filter(User.email == "investigator@veille.gov.in").first()
    if not dev_user:
        dev_user = User(
            email="investigator@veille.gov.in",
            hashed_password=get_password_hash("investigator123"),
            role="INVESTIGATOR",
            is_active=True,
        )
        db.add(dev_user)
        db.commit()
        db.refresh(dev_user)
        print(f"[+] Dev investigator created: investigator@veille.gov.in")
    else:
        print(f"[*] Dev investigator exists: investigator@veille.gov.in")

    # ── Create Demo Cases ────────────────────────────────────────────────
    demo_cases = [
        {
            "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
            "title": "Operation Nightfall Syndicate",
            "description": "Multi-jurisdictional narcotics and hawala syndicate operating across West and Central sectors.",
            "status": "ACTIVE",
            "priority": "CRITICAL",
            "primary_investigator_id": admin.id,
        },
        {
            "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
            "title": "Port Authority Smuggling",
            "description": "Illicit container logistics network utilizing forged manifests at Port Terminal 4.",
            "status": "ACTIVE",
            "priority": "HIGH",
            "primary_investigator_id": admin.id,
        },
        {
            "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
            "title": "Unidentified Network Intrusion - Sector 7",
            "description": "Cold case regarding cyber intrusion into regional communications relay.",
            "status": "COLD",
            "priority": "LOW",
            "primary_investigator_id": admin.id,
        }
    ]

    for c in demo_cases:
        existing_case = db.query(Case).filter(Case.id == c["id"]).first()
        if not existing_case:
            new_case = Case(
                id=c["id"],
                title=c["title"],
                description=c["description"],
                status=c["status"],
                priority=c["priority"],
                primary_investigator_id=c["primary_investigator_id"],
            )
            db.add(new_case)
            db.commit()
            print(f"[+] Case seeded: {c['title']} (ID: {c['id']})")
        else:
            print(f"[*] Case already exists: {c['title']}")

    # ── Seed Neo4j Knowledge Graph ───────────────────────────────────────
    try:
        case1_id = "11111111-1111-1111-1111-111111111111"
        with get_graph_session() as graph_session:
            # Clear existing demo nodes for idempotency
            graph_session.run("MATCH (n {case_id: $case_id}) DETACH DELETE n", case_id=case1_id)
            
            # Add performance indexes
            labels = ["Person", "Organization", "Account", "Phone", "Vehicle", "Location", "Event"]
            for label in labels:
                graph_session.run(f"CREATE INDEX node_case_id_{label} IF NOT EXISTS FOR (n:{label}) ON (n.case_id)")
                graph_session.run(f"CREATE INDEX node_id_{label} IF NOT EXISTS FOR (n:{label}) ON (n.id)")
            
            cypher_seed = """
            CREATE (p1:Person {id: 'Person_RajeshKumar', name: 'Rajesh Kumar (Leader)', role: 'Suspect', threat_level: 'High', case_id: $case_id})
            CREATE (p2:Person {id: 'Person_VikramMalhotra', name: 'Vikram Malhotra', role: 'Financial Operator', threat_level: 'High', case_id: $case_id})
            CREATE (p3:Person {id: 'Person_AmitabhSen', name: 'Amitabh Sen', role: 'Logistics Handler', threat_level: 'Medium', case_id: $case_id})
            CREATE (p4:Person {id: 'Person_SureshGupta', name: 'Suresh Gupta', role: 'Informant / Courier', threat_level: 'Low', case_id: $case_id})
            CREATE (p5:Person {id: 'Person_ElenaRostova', name: 'Elena Rostova', role: 'Offshore Fixer', threat_level: 'High', case_id: $case_id})
            CREATE (p6:Person {id: 'Person_TariqAziz', name: 'Tariq Aziz', role: 'Enforcer', threat_level: 'High', case_id: $case_id})
            CREATE (p7:Person {id: 'Person_UnknownAlpha', name: 'UNIDENTIFIED_ALPHA', role: 'Supplier', threat_level: 'Critical', case_id: $case_id})
            
            CREATE (org:Organization {id: 'Org_ShadowRing', name: 'Shadow Ring Syndicate', type: 'Cartel', case_id: $case_id})
            CREATE (org2:Organization {id: 'Org_MirageTrading', name: 'Mirage Trading Ltd', type: 'Front Company', case_id: $case_id})
            
            CREATE (acc1:Account {id: 'Acc_Swiss9876', name: 'Swiss Acct #9876', bank: 'Geneva Private', balance: 'USD 4.5M', case_id: $case_id})
            CREATE (acc2:Account {id: 'Acc_Cayman112', name: 'Cayman Shell Acct', bank: 'Island Trust', balance: 'USD 12M', case_id: $case_id})
            
            CREATE (ph1:Phone {id: 'Phone_9811099231', name: '+91-9811099231', carrier: 'Airtel', status: 'Intercepted', case_id: $case_id})
            CREATE (ph2:Phone {id: 'Phone_9822019943', name: '+91-9822019943', carrier: 'Jio', status: 'Monitored', case_id: $case_id})
            CREATE (ph3:Phone {id: 'Phone_SatCom', name: 'SAT-COM (Encrypted)', carrier: 'Iridium', status: 'Active', case_id: $case_id})
            
            CREATE (veh1:Vehicle {id: 'Veh_MH02DX9912', name: 'Black Fortuner', color: 'Black', case_id: $case_id})
            CREATE (veh2:Vehicle {id: 'Veh_DL4C8821', name: 'White Innova', color: 'White', case_id: $case_id})
            
            CREATE (loc1:Location {id: 'Loc_SafehouseAlpha', name: 'Safehouse Alpha (Andheri)', lat: 19.1136, lng: 72.8697, case_id: $case_id})
            CREATE (loc2:Location {id: 'Loc_PortTerminal4', name: 'Port Terminal 4', lat: 19.0330, lng: 73.0297, case_id: $case_id})
            CREATE (loc3:Location {id: 'Loc_MirageWarehouse', name: 'Mirage Warehouse (Bhiwandi)', lat: 19.3000, lng: 73.0500, case_id: $case_id})
            
            CREATE (evt1:Event {id: 'Evt_HawalaTransfer', name: 'Hawala Transfer INR 4.5 Cr', date: '2024-08-15', case_id: $case_id})
            CREATE (evt2:Event {id: 'Evt_ShipmentSeizure', name: 'Port Seizure (Container #9432)', date: '2024-09-01', case_id: $case_id})

            CREATE (p1)-[:ASSOCIATED_WITH {confidence: 0.98, role: 'Ring Leader', case_id: $case_id}]->(org)
            CREATE (p2)-[:ASSOCIATED_WITH {confidence: 0.94, role: 'Finance Head', case_id: $case_id}]->(org)
            CREATE (p3)-[:ASSOCIATED_WITH {confidence: 0.89, role: 'Logistics Head', case_id: $case_id}]->(org)
            CREATE (p4)-[:ASSOCIATED_WITH {confidence: 0.75, role: 'Courier', case_id: $case_id}]->(org)
            CREATE (p6)-[:ASSOCIATED_WITH {confidence: 0.92, role: 'Enforcer', case_id: $case_id}]->(org)
            
            CREATE (p5)-[:MANAGES_FRONT {confidence: 0.88, case_id: $case_id}]->(org2)
            CREATE (org)-[:LAUNDERS_THROUGH {confidence: 0.7, case_id: $case_id, label: 'ASSOCIATED_WITH_inferred'}]->(org2)
            
            CREATE (p1)-[:COMMUNICATES_WITH {confidence: 0.96, case_id: $case_id}]->(p2)
            CREATE (p2)-[:COMMUNICATES_WITH {confidence: 0.91, case_id: $case_id}]->(p3)
            CREATE (p3)-[:COMMUNICATES_WITH {confidence: 0.85, case_id: $case_id}]->(p4)
            CREATE (p1)-[:COMMUNICATES_WITH {confidence: 0.6, case_id: $case_id, label: 'ASSOCIATED_WITH_inferred'}]->(p7)
            CREATE (p5)-[:COMMUNICATES_WITH {confidence: 0.98, case_id: $case_id}]->(p2)
            CREATE (p6)-[:COMMUNICATES_WITH {confidence: 0.99, case_id: $case_id}]->(p1)
            
            CREATE (p1)-[:OWNS {confidence: 0.99, case_id: $case_id}]->(ph1)
            CREATE (p2)-[:OWNS {confidence: 0.99, case_id: $case_id}]->(ph2)
            CREATE (p7)-[:OWNS {confidence: 0.95, case_id: $case_id}]->(ph3)
            
            CREATE (p2)-[:OWNS {confidence: 0.95, case_id: $case_id}]->(acc1)
            CREATE (p5)-[:OWNS {confidence: 0.99, case_id: $case_id}]->(acc2)
            
            CREATE (p3)-[:OWNS {confidence: 0.92, case_id: $case_id}]->(veh1)
            CREATE (p6)-[:OWNS {confidence: 0.88, case_id: $case_id}]->(veh2)
            
            CREATE (org)-[:LOCATED_AT {confidence: 0.88, case_id: $case_id}]->(loc1)
            CREATE (p3)-[:LOCATED_AT {confidence: 0.91, case_id: $case_id}]->(loc2)
            CREATE (org2)-[:LOCATED_AT {confidence: 0.95, case_id: $case_id}]->(loc3)
            
            CREATE (p2)-[:PARTICIPATED_IN {confidence: 0.97, case_id: $case_id}]->(evt1)
            CREATE (p5)-[:PARTICIPATED_IN {confidence: 0.85, case_id: $case_id}]->(evt1)
            CREATE (p3)-[:PARTICIPATED_IN {confidence: 0.99, case_id: $case_id}]->(evt2)
            CREATE (org2)-[:LINKED_TO {confidence: 0.75, case_id: $case_id}]->(evt2)
            """
            graph_session.run(cypher_seed, case_id=case1_id)
            print("[+] Neo4j knowledge graph seeded successfully with nodes & relationships!")
    except Exception as e:
        print(f"[!] Warning: Could not seed Neo4j graph: {e}")

    print()
    print("Seed complete. Ready to authenticate and query:")
    print(f"  Admin:        {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
    print(f"  Investigator: investigator@veille.gov.in / investigator123")

finally:
    db.close()
