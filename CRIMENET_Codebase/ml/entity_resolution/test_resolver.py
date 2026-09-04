import json
from resolver import EntityResolver

def main():
    print("--- VEILLE ENTITY RESOLVER TEST ---")
    
    resolver = EntityResolver()
    
    db_name = "Rajesh Kumar"
    db_edges = ["Phone_9876543210", "Location_Mumbai"]
    
    print(f"\n[Database Entity]: {db_name} | Edges: {db_edges}")
    
    # Test 1: Typos but same structural edges
    cand1_name = "Rajesh K."
    cand1_edges = ["Phone_9876543210"]
    print(f"\n[Candidate 1]: {cand1_name} | Edges: {cand1_edges}")
    res1 = resolver.resolve_entity(cand1_name, cand1_edges, db_name, db_edges)
    print(json.dumps(res1, indent=2))
    
    # Test 2: Completely different structural edges, slight name variation
    cand2_name = "Rajesh Kumar"
    cand2_edges = ["Phone_1112223333"]
    print(f"\n[Candidate 2]: {cand2_name} | Edges: {cand2_edges}")
    res2 = resolver.resolve_entity(cand2_name, cand2_edges, db_name, db_edges)
    print(json.dumps(res2, indent=2))
    
    # Test 3: Completely different person
    cand3_name = "Amit Singh"
    cand3_edges = ["Phone_5554443333"]
    print(f"\n[Candidate 3]: {cand3_name} | Edges: {cand3_edges}")
    res3 = resolver.resolve_entity(cand3_name, cand3_edges, db_name, db_edges)
    print(json.dumps(res3, indent=2))

if __name__ == "__main__":
    main()
