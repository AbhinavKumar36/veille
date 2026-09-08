import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs("d:/project/Crimenet/diagrams", exist_ok=True)

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['font.family'] = 'sans-serif'

def create_pipeline_flowchart():
    """Generates a crisp 5-stage pipeline diagram for Slide 2"""
    fig, ax = plt.subplots(figsize=(12.2, 2.7), dpi=300)
    ax.set_facecolor('#F8FAFC')
    fig.patch.set_facecolor('#F8FAFC')

    stages = [
        ("1. Ingest & Vault", "Multi-Source Ingestion\n• Police FIRs (.pdf/.txt)\n• Telecom CDRs (.csv)\n• Hawala Ledgers (.xlsx)\n• Audio Wiretaps (.wav)\n[SHA-256 Hash Vaulted]", "#0284C7", "#E0F2FE"),
        ("2. AI Extraction", "Multi-Modal NLP & ASR\n• InLegalNER (BNS/IPC)\n• Whisper-v3 Speech ASR\n• Telecom Pattern Parser\n• Entity & Alias Tagging", "#0D9488", "#CCFBF1"),
        ("3. Outbox & Resolution", "Deduplication & Sync\n• Transactional Outbox\n• Fellegi-Sunter Match\n• Kafka Event Stream\n• Cross-Case Alias Merge", "#4F46E5", "#EEF2FF"),
        ("4. Graph Topology", "Neo4j GDS Engine\n• Knowledge Graph Sync\n• Louvain Syndicates\n• PageRank Kingpins\n• Centrality Scoring", "#7C3AED", "#F3E8FF"),
        ("5. Detective Canvas", "Investigator Workspace\n• Force-Directed Graph\n• Detective Corkboard\n• Geospatial Radar Map\n• Guardrailed RAG AI", "#0F172A", "#F1F5F9")
    ]

    box_w = 2.05
    box_h = 2.05
    start_x = 0.35
    spacing = 2.42

    for i, (title, desc, stroke, fill) in enumerate(stages):
        x = start_x + i * spacing
        y = 0.35

        # Card Box
        rect = patches.FancyBboxPatch(
            (x, y), box_w, box_h,
            boxstyle="round,pad=0.06,rounding_size=0.12",
            linewidth=1.6, edgecolor=stroke, facecolor=fill
        )
        ax.add_patch(rect)

        # Title Banner
        banner = patches.FancyBboxPatch(
            (x, y + box_h - 0.46), box_w, 0.46,
            boxstyle="round,pad=0.03,rounding_size=0.08",
            linewidth=0, facecolor=stroke
        )
        ax.add_patch(banner)

        # Title Text
        ax.text(x + box_w/2, y + box_h - 0.23, title,
                ha='center', va='center', color='white',
                fontsize=9.2, fontweight='bold')

        # Body Text
        ax.text(x + 0.1, y + box_h - 0.60, desc,
                ha='left', va='top', color='#1E293B',
                fontsize=7.4, linespacing=1.3)

        # Connecting Arrow
        if i < len(stages) - 1:
            arr_x = x + box_w + 0.05
            arr_y = y + box_h/2
            ax.annotate('', xy=(arr_x + 0.24, arr_y), xytext=(arr_x, arr_y),
                        arrowprops=dict(arrowstyle="-|>", color="#64748B", lw=2.0, mutation_scale=14))

    ax.set_xlim(0, 12.3)
    ax.set_ylim(0, 2.7)
    ax.axis('off')
    plt.tight_layout()
    out_path = "d:/project/Crimenet/diagrams/pipeline_flowchart.png"
    plt.savefig(out_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Saved {out_path}")

def create_architecture_diagram():
    """Generates a multi-layer system architecture diagram for Slide 3"""
    fig, ax = plt.subplots(figsize=(12.2, 2.8), dpi=300)
    ax.set_facecolor('#F8FAFC')
    fig.patch.set_facecolor('#F8FAFC')

    layers = [
        ("PRESENTATION LAYER", ["React 19 & TypeScript", "Detective Corkboard Canvas", "D3 Force-Directed Graph", "Sovereign RAG AI Assistant"], "#0369A1", "#F0F9FF"),
        ("INTELLIGENCE LAYER", ["InLegalNER (BNS/IPC)", "Whisper-v3 Multilingual ASR", "FastEmbed Dense Embeddings", "Louvain / PageRank GDS"], "#0F766E", "#F0FDFA"),
        ("EVENT PIPELINE LAYER", ["FastAPI Async Gateway", "Transactional Outbox Engine", "Apache Kafka Event Bus", "Celery Distributed Workers"], "#4338CA", "#EEF2FF"),
        ("STORAGE & VAULT LAYER", ["Neo4j Graph Database", "PostgreSQL 16 Metadata DB", "MinIO S3 Evidence Vault", "SHA-256 Immutability Chains"], "#334155", "#F8FAFC")
    ]

    w = 11.4
    h = 0.52
    y_start = 2.15
    y_gap = 0.65

    for i, (layer_name, components, stroke, fill) in enumerate(layers):
        y = y_start - i * y_gap

        # Outer Layer Box
        rect = patches.FancyBboxPatch(
            (0.35, y), w, h,
            boxstyle="round,pad=0.04,rounding_size=0.10",
            linewidth=1.4, edgecolor=stroke, facecolor=fill
        )
        ax.add_patch(rect)

        # Layer Label Box
        label_rect = patches.FancyBboxPatch(
            (0.45, y + 0.06), 2.5, h - 0.12,
            boxstyle="round,pad=0.03,rounding_size=0.06",
            linewidth=0, facecolor=stroke
        )
        ax.add_patch(label_rect)
        ax.text(1.70, y + h/2, layer_name,
                ha='center', va='center', color='white',
                fontsize=7.8, fontweight='bold')

        # Component Pills
        comp_start_x = 3.15
        comp_w = 1.95
        for c_idx, comp in enumerate(components):
            cx = comp_start_x + c_idx * 2.12
            pill = patches.FancyBboxPatch(
                (cx, y + 0.08), comp_w, h - 0.16,
                boxstyle="round,pad=0.03,rounding_size=0.06",
                linewidth=0.9, edgecolor=stroke, facecolor='white'
            )
            ax.add_patch(pill)
            ax.text(cx + comp_w/2, y + h/2, comp,
                    ha='center', va='center', color='#0F172A',
                    fontsize=7.2, fontweight='bold')

    ax.set_xlim(0, 12.3)
    ax.set_ylim(0, 2.8)
    ax.axis('off')
    plt.tight_layout()
    out_path = "d:/project/Crimenet/diagrams/system_architecture.png"
    plt.savefig(out_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Saved {out_path}")

def create_comparison_matrix():
    """Generates a competitive comparison visual matrix for Slide 5"""
    fig, ax = plt.subplots(figsize=(12.0, 2.4), dpi=300)
    ax.set_facecolor('#FFFFFF')
    fig.patch.set_facecolor('#FFFFFF')

    headers = ["Evaluation Criteria", "Generic Graph+LLM", "Legacy Suites (i2/Palantir)", "VEILLE AI (Our Solution)"]
    rows = [
        ["Automated Evidence Ingestion", "[X] Manual File Entry", "[!] Complex Configuration", "[✓] Native Multi-Source Vault (FIR, CDR, AML)"],
        ["Indian Legal NER (BNS 2024 / IPC)", "[X] Generic English Only", "[X] No BNS/IPC Legal Support", "[✓] InLegalNER Fine-Tuned on Indian Court Corpus"],
        ["Court-Admissible Provenance", "[X] Black-Box Outputs", "[!] Proprietary Metadata", "[✓] NIST 800-88 & Sec 65B BSA SHA-256 Hashes"],
        ["Forensic Guardrails & Citations", "[X] Prone to LLM Hallucinations", "[!] Rigid Rule-Base Only", "[✓] Evidence-Grounded Citations (Out-of-Scope Safe)"],
        ["Air-Gapped Sovereign Deployment", "[X] Requires Cloud LLM API", "[!] Heavy Enterprise Footprint", "[✓] 100% Local On-Premise LEA Station"]
    ]

    col_widths = [3.2, 2.6, 2.8, 3.4]
    row_height = 0.35
    start_y = 1.95

    # Draw Table Header
    curr_x = 0.2
    for j, (h, cw) in enumerate(zip(headers, col_widths)):
        bg_col = '#0C1E41' if j < 3 else '#0284C7'
        rect = patches.Rectangle((curr_x, start_y), cw, row_height + 0.05, facecolor=bg_col, edgecolor='#FFFFFF', lw=1)
        ax.add_patch(rect)
        ax.text(curr_x + cw/2, start_y + (row_height+0.05)/2, h, ha='center', va='center', color='white', fontsize=8.0, fontweight='bold')
        curr_x += cw

    # Draw Table Rows
    for i, row in enumerate(rows):
        y = start_y - (i + 1) * row_height
        curr_x = 0.2
        bg_row = '#F8FAFC' if i % 2 == 0 else '#FFFFFF'
        for j, (cell, cw) in enumerate(zip(row, col_widths)):
            bg = bg_row if j < 3 else ('#E0F2FE' if i % 2 == 0 else '#F0F9FF')
            rect = patches.Rectangle((curr_x, y), cw, row_height, facecolor=bg, edgecolor='#E2E8F0', lw=0.8)
            ax.add_patch(rect)
            
            align = 'left' if j == 0 or j == 3 else 'center'
            tx = curr_x + 0.1 if align == 'left' else curr_x + cw/2
            color = '#0F172A' if j < 3 else '#0369A1'
            weight = 'bold' if j == 3 or j == 0 else 'normal'
            ax.text(tx, y + row_height/2, cell, ha=align, va='center', color=color, fontsize=7.2, fontweight=weight)
            curr_x += cw

    ax.set_xlim(0, 12.3)
    ax.set_ylim(0, 2.4)
    ax.axis('off')
    plt.tight_layout()
    out_path = "d:/project/Crimenet/diagrams/comparison_matrix.png"
    plt.savefig(out_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Saved {out_path}")

if __name__ == "__main__":
    create_pipeline_flowchart()
    create_architecture_diagram()
    create_comparison_matrix()
