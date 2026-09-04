import json

class Evaluator:
    def __init__(self, ground_truth_entities, ground_truth_relationships):
        self.gt_entities = {e["id"]: e for e in ground_truth_entities}
        # Create a set of (source_id, relation, target_id) for ground truth
        self.gt_edges = set((r["source_id"], r["type"], r["target_id"]) for r in ground_truth_relationships)

    def evaluate_entities(self, candidate_entities):
        """
        Evaluates entity resolution.
        For simplicity in this framework, we assume candidate entities provide a 'mapped_to_gt_id' 
        which indicates which ground truth entity ID they claim to represent.
        In a real scenario, this mapping is done via bipartite matching of names/attributes.
        """
        tp = 0
        fp = 0
        
        # Track which GT entities have been successfully reconstructed
        recovered_gt_ids = set()
        
        for cand in candidate_entities:
            gt_id = cand.get("mapped_to_gt_id")
            if gt_id and gt_id in self.gt_entities:
                if gt_id not in recovered_gt_ids:
                    # Successfully recovered this GT entity
                    tp += 1
                    recovered_gt_ids.add(gt_id)
                else:
                    # We already recovered this GT entity, meaning the candidate is a duplicate (Failed ER)
                    # It's a False Positive because it's a redundant node
                    fp += 1
            else:
                # Hallucinated entity
                fp += 1
                
        fn = len(self.gt_entities) - tp
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return {
            "TP": tp,
            "FP": fp,
            "FN": fn,
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1": round(f1, 4)
        }

    def evaluate_relationships(self, candidate_relationships):
        """
        Evaluates relationship extraction.
        Candidate relationships must provide 'source_mapped_gt_id' and 'target_mapped_gt_id'
        """
        tp = 0
        fp = 0
        
        cand_edges = set((r.get("source_mapped_gt_id"), r["type"], r.get("target_mapped_gt_id")) 
                         for r in candidate_relationships)
                         
        for edge in cand_edges:
            # check if any element is None (meaning it failed to map to GT)
            if edge[0] is None or edge[2] is None:
                fp += 1
                continue
                
            if edge in self.gt_edges:
                tp += 1
            else:
                fp += 1
                
        fn = len(self.gt_edges) - tp
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return {
            "TP": tp,
            "FP": fp,
            "FN": fn,
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1": round(f1, 4)
        }

    def evaluate_all(self, candidate_entities, candidate_relationships):
        return {
            "Entity_Resolution": self.evaluate_entities(candidate_entities),
            "Relationship_Extraction": self.evaluate_relationships(candidate_relationships)
        }
