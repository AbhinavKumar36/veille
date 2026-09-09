import json
import os
import random

# Seed for reproducibility
random.seed(42)

# Names and details
first_names_cluster1 = ["Rajesh", "Amit", "Suresh", "Ramesh", "Deepak", "Vikram", "Anil", "Sunil", "Prakash", "Sanjay"]
last_names_cluster1 = ["Kumar", "Singh", "Sharma", "Verma", "Yadav", "Gupta"]
first_names_cluster2 = ["Mohammed", "Abdul", "Tariq", "Imran", "Farooq", "Zayed", "Rashid", "Omar", "Ali", "Hassan"]
last_names_cluster2 = ["Khan", "Sheikh", "Syed", "Ansari", "Qureshi"]

def generate_person(idx, cluster):
    if cluster == 1:
        name = f"{random.choice(first_names_cluster1)} {random.choice(last_names_cluster1)}"
    else:
        name = f"{random.choice(first_names_cluster2)} {random.choice(last_names_cluster2)}"
    return {
        "id": f"person_{idx}",
        "type": "Person",
        "name": name,
        "aliases": [name.split()[0][:3] + "u"], # e.g. Raj -> Raju
        "dob": f"{random.randint(1970, 1999)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
    }

def generate_phone(idx):
    return {
        "id": f"phone_{idx}",
        "type": "Phone",
        "number": f"+91-{random.randint(9000000000, 9999999999)}"
    }

def generate_location(idx):
    return {
        "id": f"loc_{idx}",
        "type": "Location",
        "address": f"Sector {random.randint(1, 50)}, Block {random.choice('ABCDEF')}, Plot {random.randint(1, 100)}"
    }

def generate_vehicle(idx):
    return {
        "id": f"veh_{idx}",
        "type": "Vehicle",
        "plate": f"DL-{random.randint(1,9)}C-{random.randint(1000,9999)}"
    }

def generate_organization(idx):
    return {
        "id": f"org_{idx}",
        "type": "Organization",
        "name": f"Shell Corp {idx} Pvt Ltd"
    }

def generate_event(idx):
    return {
        "id": f"evt_{idx}",
        "type": "Event",
        "name": f"Incident {idx}",
        "date": f"2026-04-{random.randint(1,28):02d}"
    }

def main():
    entities = []
    edges = []
    
    # Generate 50 entities
    # Persons: 20 (10 in cluster 1, 10 in cluster 2)
    persons_c1 = [generate_person(i, 1) for i in range(1, 11)]
    persons_c2 = [generate_person(i, 2) for i in range(11, 21)]
    
    # Bridge Entity (Accountant)
    bridge_person = {
        "id": "person_21",
        "type": "Person",
        "name": "Manish CA",
        "aliases": ["The Fixer"],
        "dob": "1980-08-15"
    }
    
    entities.extend(persons_c1)
    entities.extend(persons_c2)
    entities.append(bridge_person)
    
    # Generate remaining entities (29)
    phones = [generate_phone(i) for i in range(1, 13)] # 12 phones
    locs = [generate_location(i) for i in range(1, 7)] # 6 locations
    vehs = [generate_vehicle(i) for i in range(1, 6)]  # 5 vehicles
    orgs = [generate_organization(i) for i in range(1, 3)] # 2 orgs
    evts = [generate_event(i) for i in range(1, 5)] # 4 events
    
    entities.extend(phones)
    entities.extend(locs)
    entities.extend(vehs)
    entities.extend(orgs)
    entities.extend(evts)
    
    assert len(entities) == 50, f"Expected 50 entities, got {len(entities)}"

    # Generate 73 relationships (edges)
    # Cluster 1 internal connections
    for p in persons_c1:
        # Every person uses a phone
        ph = random.choice(phones[:6])
        edges.append({"source_id": p["id"], "target_id": ph["id"], "type": "USES"})
        
        # Some own vehicles
        if random.random() > 0.5:
            vh = random.choice(vehs[:3])
            edges.append({"source_id": p["id"], "target_id": vh["id"], "type": "OWNS"})
            
        # Affiliated with org 1
        edges.append({"source_id": p["id"], "target_id": orgs[0]["id"], "type": "AFFILIATED_WITH"})
        
        # Participate in event 1 or 2
        evt = random.choice(evts[:2])
        edges.append({"source_id": p["id"], "target_id": evt["id"], "type": "PARTICIPATED_IN"})
        
        # Located at
        loc = random.choice(locs[:3])
        edges.append({"source_id": p["id"], "target_id": loc["id"], "type": "LOCATED_AT"})
        
    # Intra-cluster 1 communications
    for i in range(5):
        p1 = random.choice(persons_c1)
        p2 = random.choice(persons_c1)
        if p1 != p2:
            edges.append({"source_id": p1["id"], "target_id": p2["id"], "type": "COMMUNICATES_WITH"})

    # Cluster 2 internal connections
    for p in persons_c2:
        ph = random.choice(phones[6:])
        edges.append({"source_id": p["id"], "target_id": ph["id"], "type": "USES"})
        
        if random.random() > 0.5:
            vh = random.choice(vehs[3:])
            edges.append({"source_id": p["id"], "target_id": vh["id"], "type": "OWNS"})
            
        edges.append({"source_id": p["id"], "target_id": orgs[1]["id"], "type": "AFFILIATED_WITH"})
        
        evt = random.choice(evts[2:])
        edges.append({"source_id": p["id"], "target_id": evt["id"], "type": "PARTICIPATED_IN"})
        
        loc = random.choice(locs[3:])
        edges.append({"source_id": p["id"], "target_id": loc["id"], "type": "LOCATED_AT"})
        
    for i in range(5):
        p1 = random.choice(persons_c2)
        p2 = random.choice(persons_c2)
        if p1 != p2:
            edges.append({"source_id": p1["id"], "target_id": p2["id"], "type": "COMMUNICATES_WITH"})
            
    # Bridge Connections
    bridge_phone = generate_phone(99)
    entities.append(bridge_phone)
    # to maintain exactly 50 entities, let's replace one phone with bridge phone
    entities.remove(phones[-1])
    
    edges.append({"source_id": bridge_person["id"], "target_id": bridge_phone["id"], "type": "USES"})
    # Bridge communicates with one from cluster 1 and one from cluster 2
    edges.append({"source_id": bridge_person["id"], "target_id": persons_c1[0]["id"], "type": "COMMUNICATES_WITH"})
    edges.append({"source_id": bridge_person["id"], "target_id": persons_c2[0]["id"], "type": "COMMUNICATES_WITH"})
    edges.append({"source_id": bridge_person["id"], "target_id": orgs[0]["id"], "type": "AFFILIATED_WITH"})
    edges.append({"source_id": bridge_person["id"], "target_id": orgs[1]["id"], "type": "AFFILIATED_WITH"})
    
    # Event OCCURRED_AT Location
    for evt in evts:
        edges.append({"source_id": evt["id"], "target_id": random.choice(locs)["id"], "type": "OCCURRED_AT"})
        
    # Trim or pad edges to exactly 73
    # Wait, how many edges did we generate? Let's fix it to exactly 73
    unique_edges = []
    seen = set()
    for e in edges:
        tup = (e["source_id"], e["target_id"], e["type"])
        if tup not in seen:
            seen.add(tup)
            unique_edges.append(e)
            
    if len(unique_edges) > 73:
        unique_edges = unique_edges[:73]
    elif len(unique_edges) < 73:
        while len(unique_edges) < 73:
            # pad with more COMMUNICATES_WITH
            p1 = random.choice(persons_c1)
            p2 = random.choice(persons_c1)
            tup = (p1["id"], p2["id"], "COMMUNICATES_WITH")
            if p1 != p2 and tup not in seen:
                seen.add(tup)
                unique_edges.append({"source_id": p1["id"], "target_id": p2["id"], "type": "COMMUNICATES_WITH"})
                
    edges = unique_edges
    assert len(edges) == 73, f"Expected 73 edges, got {len(edges)}"

    # Save outputs
    out_dir = os.path.join(os.path.dirname(__file__), "outputs")
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(out_dir, "entities.json"), "w") as f:
        json.dump(entities, f, indent=2)
        
    with open(os.path.join(out_dir, "relationships.json"), "w") as f:
        json.dump(edges, f, indent=2)
        
    print(f"Generated {len(entities)} entities and {len(edges)} relationships in {out_dir}")

if __name__ == "__main__":
    main()
