import json
from extractor import NLPExtractor
from pydantic import ValidationError

def main():
    print("--- VEILLE NLP EXTRACTOR TEST ---")
    
    extractor = NLPExtractor()
    
    mock_text = "Rajesh Kumar (Age 45) was seen driving a Toyota Innova with plate MH04-1234."
    print(f"\nInput Text: '{mock_text}'")
    
    try:
        graph = extractor.process_document(mock_text)
        print("\n[SUCCESS] Extracted Graph:")
        print(graph.model_dump_json(indent=2))
        
        # Verify schema constraints
        assert len(graph.entities) == 2
        assert len(graph.relationships) == 1
        assert graph.entities[0].label == "Person"
        
        print("\nAll constraints passed validation!")
        
    except ValidationError as e:
        print("\n[FAILED] Schema Validation Error:")
        print(e)

if __name__ == "__main__":
    main()
