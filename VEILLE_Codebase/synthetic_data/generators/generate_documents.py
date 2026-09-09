import json
import os
import random
import csv

# Seed for reproducibility
random.seed(42)

def inject_typo(name, p_typo=0.15):
    if random.random() < p_typo:
        # Simple typo injection: drop a character
        if len(name) > 3:
            idx = random.randint(1, len(name)-2)
            if name[idx] != ' ':
                return name[:idx] + name[idx+1:]
    return name

def load_ground_truth():
    gt_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ground_truth", "outputs")
    
    with open(os.path.join(gt_dir, "entities.json"), "r") as f:
        entities = json.load(f)
        
    with open(os.path.join(gt_dir, "relationships.json"), "r") as f:
        relationships = json.load(f)
        
    return entities, relationships

def generate_firs(entities, relationships, out_dir):
    persons = [e for e in entities if e["type"] == "Person"]
    vehs = [e for e in entities if e["type"] == "Vehicle"]
    orgs = [e for e in entities if e["type"] == "Organization"]
    
    fir_dir = os.path.join(out_dir, "firdocs")
    os.makedirs(fir_dir, exist_ok=True)
    
    for i in range(1, 6):
        # Pick random entities
        p = random.choice(persons)
        v = random.choice(vehs) if vehs else None
        o = random.choice(orgs) if orgs else None
        
        name = inject_typo(p["name"])
        alias_str = f" (aka {p['aliases'][0]})" if p.get("aliases") else ""
        
        text = f"FIRST INFORMATION REPORT {i:03d}\n\n"
        text += f"On {random.randint(1,28)} April 2026, it was observed that {name}{alias_str} was present at the scene. "
        
        if v:
            text += f"The suspect was seen operating a vehicle bearing registration {v['plate']}. "
            
        if o:
            text += f"Intelligence suggests a strong affiliation with {o['name']}. "
            
        # Red herring injection
        if random.random() < 0.20:
            text += "A bystander, unknown to the network named 'Rahul Random', was questioned and released. "
            
        text += "\nInvestigation is ongoing."
        
        with open(os.path.join(fir_dir, f"FIR_{i:03d}.txt"), "w") as f:
            f.write(text)

def generate_cdrs(entities, relationships, out_dir):
    cdr_dir = os.path.join(out_dir, "cdrs")
    os.makedirs(cdr_dir, exist_ok=True)
    
    phones = {e["id"]: e for e in entities if e["type"] == "Phone"}
    comm_edges = [r for r in relationships if r["type"] == "COMMUNICATES_WITH"]
    
    # We need to map Person -> Phone
    uses_edges = [r for r in relationships if r["type"] == "USES"]
    person_to_phone = {}
    for u in uses_edges:
        if u["source_id"] not in person_to_phone:
            person_to_phone[u["source_id"]] = []
        person_to_phone[u["source_id"]].append(u["target_id"])
    
    records = []
    
    # For every COMMUNICATES_WITH edge between Person A and Person B,
    # generate phone calls between their phones.
    for edge in comm_edges:
        p1 = edge["source_id"]
        p2 = edge["target_id"]
        
        phones1 = person_to_phone.get(p1, [])
        phones2 = person_to_phone.get(p2, [])
        
        if not phones1 or not phones2:
            continue
            
        # Generate 10-20 calls for this relationship
        num_calls = random.randint(10, 20)
        for _ in range(num_calls):
            ph1 = random.choice(phones1)
            ph2 = random.choice(phones2)
            
            num1 = phones[ph1]["number"]
            num2 = phones[ph2]["number"]
            
            # Burner phone injection (untracked number)
            if random.random() < 0.05:
                num1 = f"+91-{random.randint(6000000000, 6999999999)}"
                
            tower = f"TOW-{random.randint(100, 999)}"
            if random.random() < 0.10: # Missing tower
                tower = ""
                
            records.append({
                "timestamp": f"2026-04-{random.randint(1,28):02d}T{random.randint(0,23):02d}:{random.randint(0,59):02d}:00Z",
                "caller": num1,
                "receiver": num2,
                "duration_seconds": random.randint(10, 1800),
                "cell_tower_id": tower
            })
            
    # Write CSV
    with open(os.path.join(cdr_dir, "telecom_logs.csv"), "w", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["timestamp", "caller", "receiver", "duration_seconds", "cell_tower_id"])
        writer.writeheader()
        writer.writerows(records)

def main():
    try:
        entities, relationships = load_ground_truth()
    except FileNotFoundError:
        print("Error: Ground truth not found. Please run generate_ground_truth.py first.")
        return
        
    out_dir = os.path.join(os.path.dirname(__file__), "outputs")
    os.makedirs(out_dir, exist_ok=True)
    
    generate_firs(entities, relationships, out_dir)
    generate_cdrs(entities, relationships, out_dir)
    
    print(f"Generated noisy FIRs and CDRs in {out_dir}")

if __name__ == "__main__":
    main()
