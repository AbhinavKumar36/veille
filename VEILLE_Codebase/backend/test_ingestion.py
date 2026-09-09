import json
from fastapi.testclient import TestClient
import uuid

# Set up some mock env vars if needed
import os
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from api.main import app

client = TestClient(app)

def main():
    print("--- VEILLE INGESTION API TEST ---")
    
    # Create dummy files for testing
    os.makedirs("tmp", exist_ok=True)
    with open("tmp/dummy.pdf", "wb") as f:
        f.write(b"PDF CONTENT MOCK")
    with open("tmp/dummy.csv", "wb") as f:
        f.write(b"CSV CONTENT MOCK")

    case_id = str(uuid.uuid4())
    print(f"Using test case_id: {case_id}")

    # Test 1: Upload a PDF (FIR)
    print("\n[TEST 1] Uploading FIR (PDF)...")
    with open("tmp/dummy.pdf", "rb") as f:
        response = client.post(
            "/api/v1/evidence/upload",
            data={"case_id": case_id, "source_type": "FIR"},
            files={"file": ("dummy.pdf", f, "application/pdf")}
        )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 202

    # Test 2: Upload a CSV (CDR)
    print("\n[TEST 2] Uploading CDR (CSV)...")
    with open("tmp/dummy.csv", "rb") as f:
        response = client.post(
            "/api/v1/evidence/upload",
            data={"case_id": case_id, "source_type": "CDR"},
            files={"file": ("dummy.csv", f, "text/csv")}
        )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 202
    
    # Test 3: Upload Invalid Source Type
    print("\n[TEST 3] Uploading with Invalid Source Type...")
    with open("tmp/dummy.csv", "rb") as f:
        response = client.post(
            "/api/v1/evidence/upload",
            data={"case_id": case_id, "source_type": "INVALID"},
            files={"file": ("dummy.csv", f, "text/csv")}
        )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 400

    print("\nAll tests passed successfully!")

if __name__ == "__main__":
    main()
