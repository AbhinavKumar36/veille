import os
import csv

def generate_dataset():
    # Ensure directory exists
    samples_dir = os.path.join(os.path.dirname(__file__), "samples")
    os.makedirs(samples_dir, exist_ok=True)
    
    # 1. Generate FIR (TXT)
    fir_content = """FIRST INFORMATION REPORT (FIR)
Date: 2023-10-14
Location: Mumbai, Andheri East

Incident Details:
Officers observed a suspicious meeting between Rajesh Kumar (Age: 45) and an unknown associate later identified as Amit Singh. 
Rajesh Kumar was seen entering a black Toyota Innova with license plate MH04-1234. 
Intelligence suggests Rajesh is associated with the 'Shadow' smuggling ring. Amit Singh was seen carrying a large duffel bag.
"""
    with open(os.path.join(samples_dir, "FIR_001_Rajesh.txt"), "w") as f:
        f.write(fir_content)
        
    # 2. Generate CDR (Call Detail Records) (CSV)
    cdr_data = [
        ["caller_id", "receiver_id", "timestamp", "duration_seconds"],
        ["9876543210", "1112223333", "2023-10-14T14:30:00Z", "124"],
        ["1112223333", "5554443333", "2023-10-14T14:35:00Z", "45"],
        ["9876543210", "9998887777", "2023-10-15T09:00:00Z", "600"],
    ]
    with open(os.path.join(samples_dir, "CDR_Oct_2023.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(cdr_data)
        
    # 3. Generate Financial Logs (CSV)
    fin_data = [
        ["account_source", "account_target", "amount", "currency", "date"],
        ["ACCT_777", "ACCT_888", "50000", "INR", "2023-10-13"],
        ["ACCT_888", "ACCT_999", "45000", "INR", "2023-10-15"],
    ]
    with open(os.path.join(samples_dir, "FIN_Transactions.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(fin_data)

    print(f"Successfully generated synthetic dataset in {samples_dir}")
    print("Files created: FIR_001_Rajesh.txt, CDR_Oct_2023.csv, FIN_Transactions.csv")

if __name__ == "__main__":
    generate_dataset()
