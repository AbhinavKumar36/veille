import sys
import os
import io
import json
from dotenv import load_dotenv

project_root = r"d:\project\Crimenet\CRIMENET_Codebase"
backend_root = r"d:\project\Crimenet\CRIMENET_Codebase\backend"
load_dotenv(os.path.join(backend_root, ".env"))

if project_root not in sys.path:
    sys.path.insert(0, project_root)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from core.database import SessionLocal
from db.models import Case, Evidence, OutboxEvent
from workers.tasks import extract_entities_task, process_structured_data_task
from workers.outbox_processor import process_outbox_events

db = SessionLocal()
case = db.query(Case).first()
if not case:
    print("No case found! Creating default case...")
    case = Case(title="Operation Shadow", description="Narcotics and Smuggling Syndicate Investigation", priority="CRITICAL")
    db.add(case)
    db.commit()
    db.refresh(case)

case_id = str(case.id)
print(f"Target Case: {case_id} — '{case.title}'")

samples_dir = os.path.join(project_root, "synthetic_data", "samples")
fir_path = os.path.join(samples_dir, "FIR_001_Rajesh.txt")
cdr_path = os.path.join(samples_dir, "CDR_Oct_2023.csv")
fin_path = os.path.join(samples_dir, "FIN_Transactions.csv")

# 1. Process FIR with Gemini 2.5 Flash
print("\n--- 1. PROCESSING FIR WITH GEMINI ---")
fir_ev = db.query(Evidence).filter(Evidence.case_id == case.id, Evidence.original_filename == "FIR_001_Rajesh.txt").first()
if not fir_ev:
    fir_ev = Evidence(case_id=case.id, file_path=fir_path, source_type="FIR", original_filename="FIR_001_Rajesh.txt", file_size_bytes=os.path.getsize(fir_path), status="PENDING")
    db.add(fir_ev)
    db.commit()
    db.refresh(fir_ev)

res_fir = extract_entities_task(str(fir_ev.id), fir_path, case_id)
print(f"FIR processing complete! Extracted: {res_fir.get('entities_extracted', 0)} entities, {res_fir.get('relationships_extracted', 0)} relations")

# 2. Process CDR
print("\n--- 2. PROCESSING CDR (TELECOM) ---")
cdr_ev = db.query(Evidence).filter(Evidence.case_id == case.id, Evidence.original_filename == "CDR_Oct_2023.csv").first()
if not cdr_ev:
    cdr_ev = Evidence(case_id=case.id, file_path=cdr_path, source_type="CDR", original_filename="CDR_Oct_2023.csv", file_size_bytes=os.path.getsize(cdr_path), status="PENDING")
    db.add(cdr_ev)
    db.commit()
    db.refresh(cdr_ev)

res_cdr = process_structured_data_task(str(cdr_ev.id), "CDR", cdr_path, case_id)
print(f"CDR processing complete! Extracted: {res_cdr.get('entities_extracted', 0)} entities, {res_cdr.get('relationships_extracted', 0)} relations")

# 3. Process FINANCIAL
print("\n--- 3. PROCESSING FINANCIAL TRANSACTIONS ---")
fin_ev = db.query(Evidence).filter(Evidence.case_id == case.id, Evidence.original_filename == "FIN_Transactions.csv").first()
if not fin_ev:
    fin_ev = Evidence(case_id=case.id, file_path=fin_path, source_type="FINANCIAL", original_filename="FIN_Transactions.csv", file_size_bytes=os.path.getsize(fin_path), status="PENDING")
    db.add(fin_ev)
    db.commit()
    db.refresh(fin_ev)

res_fin = process_structured_data_task(str(fin_ev.id), "FINANCIAL", fin_path, case_id)
print(f"Financial processing complete! Extracted: {res_fin.get('entities_extracted', 0)} entities, {res_fin.get('relationships_extracted', 0)} relations")

# 4. Flush Outbox to Neo4j
print("\n--- 4. FLUSHING OUTBOX EVENTS TO NEO4J ---")
process_outbox_events()
print("Outbox sync complete!")

# 5. Verify Neo4j Graph
from core.graph_db import get_graph_session
with get_graph_session() as session:
    nodes = list(session.run(
        "MATCH (n) WHERE n.case_id = $case_id RETURN labels(n) as lbl, n.id as id, n.name as name, n.lat as lat, n.lng as lng, n.role as role, n.risk_score as risk",
        case_id=case_id
    ))
    print(f"\n--- 5. VERIFYING NEO4J GRAPH: {len(nodes)} TOTAL NODES ---")
    for n in nodes:
        lbl = n['lbl'][0] if n['lbl'] else 'Entity'
        coords = f"({n['lat']}, {n['lng']})" if n['lat'] is not None else "No Coords"
        print(f"  [{lbl}] {n['name']} | ID: {n['id']} | Coords: {coords} | Role: {n['role']} | Risk: {n['risk']}")

    edges = list(session.run(
        "MATCH (n)-[r]->(m) WHERE n.case_id = $case_id RETURN n.name as src, type(r) as rel, m.name as dst",
        case_id=case_id
    ))
    print(f"\n--- 6. VERIFYING NEO4J GRAPH: {len(edges)} TOTAL EDGES ---")
    for e in edges:
        print(f"  {e['src']} --[{e['rel']}]--> {e['dst']}")

# 6. Test Geospatial Endpoint
print("\n--- 7. TESTING GEOSPATIAL ENDPOINT ---")
from api.routers.geospatial import get_geospatial_locations
locs = get_geospatial_locations(case_id=case_id, current_user={"id": "test", "role": "HEAD"})
print(f"Geospatial locations returned: {len(locs)}")
for l in locs:
    print(f"  Pin: '{l['label']}' at ({l['lat']}, {l['lng']}) — {l['details']}")
