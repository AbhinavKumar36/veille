import json
import os
from evaluator import Evaluator

def main():
    print("--- VEILLE EVALUATOR TEST ---")
    
    # 1. Load Ground Truth
    gt_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ground_truth", "outputs")
    
    try:
        with open(os.path.join(gt_dir, "entities.json"), "r") as f:
            gt_entities = json.load(f)
        with open(os.path.join(gt_dir, "relationships.json"), "r") as f:
            gt_edges = json.load(f)
    except FileNotFoundError:
        print("Error: Ground truth not found. Please run generate_ground_truth.py first.")
        return
        
    print(f"Loaded Ground Truth: {len(gt_entities)} Entities, {len(gt_edges)} Relationships")
    
    # 2. Simulate an AI Reconstruction Pipeline Output
    # We will simulate a pipeline that:
    # - Gets 45 out of 50 entities right (5 False Negatives)
    # - Hallucinates 2 extra entities (2 False Positives)
    # - Duplicates 3 entities because it failed entity resolution (3 False Positives)
    
    cand_entities = []
    
    # Add 45 correct entities
    for i in range(45):
        cand_entities.append({"id": f"cand_node_{i}", "mapped_to_gt_id": gt_entities[i]["id"]})
        
    # Hallucinate 2 entities
    cand_entities.append({"id": "cand_node_45", "mapped_to_gt_id": None})
    cand_entities.append({"id": "cand_node_46", "mapped_to_gt_id": "non_existent_gt"})
    
    # Duplicate 3 entities (failed resolution - meaning cand_node_47, 48, 49 point to gt_entities[0], [1], [2])
    cand_entities.append({"id": "cand_node_47", "mapped_to_gt_id": gt_entities[0]["id"]})
    cand_entities.append({"id": "cand_node_48", "mapped_to_gt_id": gt_entities[1]["id"]})
    cand_entities.append({"id": "cand_node_49", "mapped_to_gt_id": gt_entities[2]["id"]})

    # Simulate Relationship Extraction:
    # - Gets 60 out of 73 correct
    # - Hallucinates 5 bad edges
    
    cand_edges = []
    for i in range(60):
        cand_edges.append({
            "source_mapped_gt_id": gt_edges[i]["source_id"],
            "type": gt_edges[i]["type"],
            "target_mapped_gt_id": gt_edges[i]["target_id"]
        })
        
    # Hallucinate 5 edges
    for i in range(5):
         cand_edges.append({
            "source_mapped_gt_id": gt_entities[0]["id"],
            "type": "COMMUNICATES_WITH",
            "target_mapped_gt_id": gt_entities[i+5]["id"]
        })
         
    print(f"Simulated Candidates: {len(cand_entities)} Entities, {len(cand_edges)} Relationships")
    
    # 3. Evaluate
    evaluator = Evaluator(gt_entities, gt_edges)
    results = evaluator.evaluate_all(cand_entities, cand_edges)
    
    print("\n--- RESULTS ---")
    print(json.dumps(results, indent=2))
    
    print("\nCheck:")
    print("Expected Entity Precision: 45 / (45 + 5) = 0.90")
    print("Expected Entity Recall: 45 / 50 = 0.90")
    print("Expected Edge Precision: 60 / 65 = 0.9231")
    print("Expected Edge Recall: 60 / 73 = 0.8219")
    
    if results["Entity_Resolution"]["F1"] < 0.80:
        print("\nWARNING: Pipeline failed to meet 0.80 F1 threshold.")

if __name__ == "__main__":
    main()
