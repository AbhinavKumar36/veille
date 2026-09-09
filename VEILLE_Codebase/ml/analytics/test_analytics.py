import json
from graph_algorithms import GraphAnalytics

def main():
    print("--- VEILLE GRAPH ANALYTICS TEST ---")
    
    analytics = GraphAnalytics()
    
    # Mocking a Star Graph where Rajesh is the center hub
    nodes = {
        "Person_Rajesh": {},
        "Person_Amit": {},
        "Person_Sunil": {},
        "Phone_123": {},
        "Vehicle_MH04": {}
    }
    
    edges = [
        {"source": "Person_Rajesh", "target": "Person_Amit"},
        {"source": "Person_Rajesh", "target": "Person_Sunil"},
        {"source": "Person_Rajesh", "target": "Phone_123"},
        {"source": "Person_Rajesh", "target": "Vehicle_MH04"},
        {"source": "Person_Amit", "target": "Phone_123"} # Amit knows Rajesh's phone
    ]
    
    print("\n[TEST 1] Degree Centrality & Priority Scoring")
    priorities = analytics.calculate_degree_centrality("case_1", nodes, edges)
    for node, score in priorities.items():
        print(f"Node: {node.ljust(15)} | Priority Score: {score}")
        
    print("\n[TEST 2] Shortest Path (Dijkstra Simulation)")
    # Path from Sunil to Amit
    path = analytics.find_shortest_path("Person_Sunil", "Person_Amit", edges)
    print(f"Shortest path from Sunil to Amit: {' -> '.join(path)}")

if __name__ == "__main__":
    main()
