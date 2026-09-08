import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('d:/project/Crimenet/diagrams_v2', exist_ok=True)

# 1. Slide 2 Workflow Flowchart: Ingestion -> Local NLP -> ER -> Graph -> Canvas
def generate_slide2_workflow():
    fig, ax = plt.subplots(figsize=(10, 11), dpi=300)
    ax.set_facecolor('#0d1527')
    fig.patch.set_facecolor('#0d1527')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # Card 1: Investigator UX
    rect1 = patches.FancyBboxPatch((0.5, 9.0), 9.0, 1.6, boxstyle="round,pad=0.1,rounding_size=0.2",
                                  facecolor='#1e293b', edgecolor='#38bdf8', linewidth=2)
    ax.add_patch(rect1)
    ax.text(5.0, 10.2, "INVESTIGATOR UX  -  React 18 + Vite Frontend", ha='center', va='center',
            color='#38bdf8', fontsize=13, fontweight='bold', fontfamily='sans-serif')
    ax.text(5.0, 9.5, "Interactive Graph Canvas   |   Evidence Workspace   |   Human Review Queue",
            ha='center', va='center', color='#f8fafc', fontsize=11, fontfamily='sans-serif')

    # Arrow 1 -> 2
    ax.annotate('', xy=(5.0, 7.8), xytext=(5.0, 9.0),
                arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', width=2.5, headwidth=9, shrink=0.05))

    # Card 2: API Gateway & Security
    rect2 = patches.FancyBboxPatch((0.5, 6.4), 9.0, 1.4, boxstyle="round,pad=0.1,rounding_size=0.2",
                                  facecolor='#1e293b', edgecolor='#0ea5e9', linewidth=1.5)
    ax.add_patch(rect2)
    ax.text(5.0, 7.35, "SECURE API GATEWAY  -  FastAPI Async Backend", ha='center', va='center',
            color='#0ea5e9', fontsize=12, fontweight='bold', fontfamily='sans-serif')
    ax.text(5.0, 6.75, "RBAC Middleware   *   Case Isolation Boundary   *   Audit & Section 65B Logging",
            ha='center', va='center', color='#cbd5e1', fontsize=10.5, fontfamily='sans-serif')

    # Arrow 2 -> 3
    ax.annotate('', xy=(5.0, 5.2), xytext=(5.0, 6.4),
                arrowprops=dict(facecolor='#0ea5e9', edgecolor='#0ea5e9', width=2.5, headwidth=9, shrink=0.05))

    # Card 3: Async Intelligence Engine
    rect3 = patches.FancyBboxPatch((0.5, 2.5), 9.0, 2.7, boxstyle="round,pad=0.1,rounding_size=0.2",
                                  facecolor='#1e293b', edgecolor='#10b981', linewidth=2)
    ax.add_patch(rect3)
    ax.text(5.0, 4.85, "ASYNCHRONOUS INTELLIGENCE PIPELINE", ha='center', va='center',
            color='#10b981', fontsize=12, fontweight='bold', fontfamily='sans-serif')

    # 3 sub-boxes inside pipeline
    sub_boxes = [
        ("Local Extraction", "Ollama (Llama-3/Mistral)\n+ FastNER / OCR", 0.8, 2.8, 2.6),
        ("Entity Resolution", "Multi-Factor Scoring\n(TF-IDF + Jaro-Winkler)", 3.7, 2.8, 2.6),
        ("Graph Algorithms", "Louvain Communities\n+ Dijkstra & Bridges", 6.6, 2.8, 2.6),
    ]
    for title, desc, x, y, w in sub_boxes:
        s_rect = patches.FancyBboxPatch((x, y), w, 1.6, boxstyle="round,pad=0.08,rounding_size=0.15",
                                       facecolor='#0f172a', edgecolor='#334155', linewidth=1.2)
        ax.add_patch(s_rect)
        ax.text(x + w/2, y + 1.25, title, ha='center', va='center', color='#38bdf8', fontsize=10, fontweight='bold')
        ax.text(x + w/2, y + 0.65, desc, ha='center', va='center', color='#94a3b8', fontsize=8.5, multialignment='center')

    # Mini arrows between sub boxes
    ax.annotate('', xy=(3.6, 3.6), xytext=(3.45, 3.6),
                arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=1.5, headwidth=6))
    ax.annotate('', xy=(6.5, 3.6), xytext=(6.35, 3.6),
                arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=1.5, headwidth=6))

    # Arrow 3 -> 4
    ax.annotate('', xy=(5.0, 1.4), xytext=(5.0, 2.5),
                arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=2.5, headwidth=9, shrink=0.05))

    # Storage Layer (3 boxes at bottom)
    storages = [
        ("SQLite / Postgres", "Cases, Users & Audit Logs", 0.5, 0.2, 2.8, '#818cf8'),
        ("Neo4j Graph DB", "Knowledge Graph & Linked Entities", 3.6, 0.2, 2.8, '#38bdf8'),
        ("Air-Gapped Vault", "Raw Evidence (PDF/CDR)", 6.7, 0.2, 2.8, '#f59e0b'),
    ]
    for title, desc, x, y, w, col in storages:
        st_rect = patches.FancyBboxPatch((x, y), w, 1.2, boxstyle="round,pad=0.08,rounding_size=0.15",
                                        facecolor='#1e293b', edgecolor=col, linewidth=1.5)
        ax.add_patch(st_rect)
        ax.text(x + w/2, y + 0.8, title, ha='center', va='center', color=col, fontsize=10.5, fontweight='bold')
        ax.text(x + w/2, y + 0.35, desc, ha='center', va='center', color='#cbd5e1', fontsize=8.5)

    plt.tight_layout()
    out_path = 'd:/project/Crimenet/diagrams_v2/slide2_workflow.png'
    plt.savefig(out_path, dpi=300, bbox_inches='tight', facecolor='#0d1527')
    plt.close()
    print(f"Generated {out_path}")

# 2. Slide 3 Swimlane Flowchart: Evidence Processing & Graph Updates
def generate_slide3_swimlane():
    fig, ax = plt.subplots(figsize=(16, 9.5), dpi=300)
    ax.set_facecolor('#f8fafc')
    fig.patch.set_facecolor('#f8fafc')
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9.5)
    ax.axis('off')

    # Title Banner
    ax.text(8.0, 9.15, "Evidence Processing & Graph Updates: Swimlane Flowchart",
            ha='center', va='center', color='#0f172a', fontsize=16, fontweight='bold', fontfamily='sans-serif')

    # Start pill
    start_pill = patches.FancyBboxPatch((0.4, 7.8), 2.2, 0.65, boxstyle="round,pad=0.05,rounding_size=0.3",
                                       facecolor='#e2e8f0', edgecolor='#64748b', linewidth=1.2)
    ax.add_patch(start_pill)
    ax.text(1.5, 8.12, "Start: User Upload", ha='center', va='center', color='#0f172a', fontsize=9.5, fontweight='bold')

    # Swimlane 1: Ingestion & API Gateway (Blue)
    lane1_patch = patches.FancyBboxPatch((0.4, 5.7), 7.2, 1.8, boxstyle="round,pad=0.05,rounding_size=0.15",
                                        facecolor='#e0f2fe', edgecolor='#0284c7', linewidth=1.5)
    ax.add_patch(lane1_patch)
    ax.text(0.6, 7.25, "System: Gateway / Ingestion API (FastAPI)", ha='left', va='center', color='#0369a1', fontsize=10.5, fontweight='bold')

    # Steps in Lane 1
    s1_1 = patches.FancyBboxPatch((0.6, 6.4), 3.2, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#0284c7')
    ax.add_patch(s1_1)
    ax.text(2.2, 6.72, "1. Ingest PDF / CDR / Bank CSV", ha='center', va='center', color='#0f172a', fontsize=8.5, fontweight='bold')

    s1_2 = patches.FancyBboxPatch((4.1, 6.4), 3.3, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#0284c7')
    ax.add_patch(s1_2)
    ax.text(5.75, 6.72, "2. SHA-256 Hash + DB Record", ha='center', va='center', color='#0f172a', fontsize=8.5, fontweight='bold')

    s1_3 = patches.FancyBboxPatch((2.2, 5.85), 3.6, 0.48, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#0284c7')
    ax.add_patch(s1_3)
    ax.text(4.0, 6.09, "3. Dispatch to Async Processing Queue", ha='center', va='center', color='#0f172a', fontsize=8)

    # Arrow from start to Lane 1
    ax.annotate('', xy=(2.2, 7.05), xytext=(1.5, 7.8),
                arrowprops=dict(facecolor='#0284c7', edgecolor='#0284c7', width=1.5, headwidth=6))
    # Arrow inside lane 1
    ax.annotate('', xy=(4.1, 6.72), xytext=(3.8, 6.72),
                arrowprops=dict(facecolor='#0284c7', edgecolor='#0284c7', width=1.5, headwidth=6))
    ax.annotate('', xy=(4.0, 6.33), xytext=(5.75, 6.4),
                arrowprops=dict(facecolor='#0284c7', edgecolor='#0284c7', width=1.5, headwidth=6))

    # Swimlane 2: Concurrent UX Process (Right side top)
    lane2_patch = patches.FancyBboxPatch((8.2, 5.7), 7.4, 2.6, boxstyle="round,pad=0.05,rounding_size=0.15",
                                        facecolor='#f1f5f9', edgecolor='#475569', linewidth=1.5)
    ax.add_patch(lane2_patch)
    ax.text(8.4, 8.05, "Lane: Concurrent UX Process (Realtime Non-Blocking)", ha='left', va='center', color='#334155', fontsize=10.5, fontweight='bold')

    ux1 = patches.FancyBboxPatch((8.5, 7.1), 6.8, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#64748b')
    ax.add_patch(ux1)
    ax.text(11.9, 7.42, "Investigator UX: Tracks Job ID (202 Accepted) -> Non-blocking UI", ha='center', va='center', color='#0f172a', fontsize=8.5, fontweight='bold')

    ux2 = patches.FancyBboxPatch((8.5, 6.0), 3.2, 0.8, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#0284c7')
    ax.add_patch(ux2)
    ax.text(10.1, 6.4, "FastAPI WebSocket\nEmits 'Graph Updated'", ha='center', va='center', color='#0369a1', fontsize=8, fontweight='bold', multialignment='center')

    ux3 = patches.FancyBboxPatch((12.1, 6.0), 3.2, 0.8, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ecfdf5', edgecolor='#059669')
    ax.add_patch(ux3)
    ax.text(13.7, 6.4, "Investigator Canvas:\nAuto-Refreshes Nodes & Links", ha='center', va='center', color='#047857', fontsize=8, fontweight='bold', multialignment='center')

    # Arrow from Ingestion to Concurrent UX
    ax.annotate('', xy=(8.5, 7.42), xytext=(5.8, 5.85),
                arrowprops=dict(facecolor='#64748b', edgecolor='#64748b', width=1.5, headwidth=6))
    ax.annotate('', xy=(12.1, 6.4), xytext=(11.7, 6.4),
                arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=1.5, headwidth=6))

    # Swimlane 3: Asynchronous Background Intelligence Processing (Green Big Box at Bottom)
    lane3_patch = patches.FancyBboxPatch((0.4, 0.3), 15.2, 5.1, boxstyle="round,pad=0.05,rounding_size=0.15",
                                        facecolor='#ecfdf5', edgecolor='#059669', linewidth=1.5)
    ax.add_patch(lane3_patch)
    ax.text(0.6, 5.15, "Lane: Asynchronous Background Intelligence Pipeline", ha='left', va='center', color='#047857', fontsize=11, fontweight='bold')

    # Sub-box A: NLP Worker
    w1 = patches.FancyBboxPatch((0.7, 4.2), 6.8, 0.75, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#059669')
    ax.add_patch(w1)
    ax.text(4.1, 4.57, "Local NLP / OCR Extraction: Ollama (Llama-3/Mistral) + FastNER Regex", ha='center', va='center', color='#0f172a', fontsize=8.5, fontweight='bold')

    # Arrow from Lane 1 to NLP Worker
    ax.annotate('', xy=(4.1, 4.95), xytext=(4.0, 5.85),
                arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=1.5, headwidth=6))

    # Sub-box B: Candidate Graph Generation
    w2 = patches.FancyBboxPatch((0.7, 3.2), 6.8, 0.75, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#059669')
    ax.add_patch(w2)
    ax.text(4.1, 3.57, "Candidate Graph Generation: Extracted Entities, Phone Nos, Bank Accounts & Edges", ha='center', va='center', color='#0f172a', fontsize=8.5, fontweight='bold')

    ax.annotate('', xy=(4.1, 3.95), xytext=(4.1, 4.2),
                arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=1.5, headwidth=6))

    # Sub-box C: Entity Resolution Box (Purple Lane)
    er_lane = patches.FancyBboxPatch((0.7, 0.6), 14.6, 2.4, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#f5f3ff', edgecolor='#7c3aed', linewidth=1.2)
    ax.add_patch(er_lane)
    ax.text(0.9, 2.75, "Entity Resolution (ER) Engine & Confidence Decision", ha='left', va='center', color='#6d28d9', fontsize=10, fontweight='bold')

    # ER Steps
    er1 = patches.FancyBboxPatch((1.0, 1.9), 4.2, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#7c3aed')
    ax.add_patch(er1)
    ax.text(3.1, 2.22, "Query Neo4j for Candidate Matches\n(Phonetic Double Metaphone + TF-IDF)", ha='center', va='center', color='#0f172a', fontsize=7.5, multialignment='center')

    er2 = patches.FancyBboxPatch((5.6, 1.9), 4.2, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#7c3aed')
    ax.add_patch(er2)
    ax.text(7.7, 2.22, "Calculate Multi-Factor Similarity\n(Jaro-Winkler + Graph Context)", ha='center', va='center', color='#0f172a', fontsize=7.5, multialignment='center')

    # Decision Diamond
    diamond = patches.Polygon([[11.5, 2.22], [12.5, 2.55], [13.5, 2.22], [12.5, 1.89]], closed=True,
                              facecolor='#fef08a', edgecolor='#ca8a04', linewidth=1.5)
    ax.add_patch(diamond)
    ax.text(12.5, 2.22, "Confidence\n>= 0.85?", ha='center', va='center', color='#713f12', fontsize=7.5, fontweight='bold', multialignment='center')

    ax.annotate('', xy=(5.6, 2.22), xytext=(5.2, 2.22), arrowprops=dict(facecolor='#7c3aed', edgecolor='#7c3aed', width=1.5, headwidth=6))
    ax.annotate('', xy=(11.5, 2.22), xytext=(9.8, 2.22), arrowprops=dict(facecolor='#7c3aed', edgecolor='#7c3aed', width=1.5, headwidth=6))
    ax.annotate('', xy=(3.1, 2.55), xytext=(4.1, 3.2), arrowprops=dict(facecolor='#7c3aed', edgecolor='#7c3aed', width=1.5, headwidth=6))

    # Branch True: Upsert Neo4j
    b_true = patches.FancyBboxPatch((1.0, 0.8), 6.2, 0.8, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ecfdf5', edgecolor='#059669', linewidth=1.2)
    ax.add_patch(b_true)
    ax.text(4.1, 1.2, "Auto-Merge into Neo4j Knowledge Graph\nUpsert Nodes & Edges (Linked with SHA-256 evidence_id)", ha='center', va='center', color='#065f46', fontsize=8, fontweight='bold', multialignment='center')

    # Branch Ambiguous: Human Review Queue
    b_ambig = patches.FancyBboxPatch((7.8, 0.8), 6.5, 0.8, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#fff7ed', edgecolor='#ea580c', linewidth=1.2)
    ax.add_patch(b_ambig)
    ax.text(11.05, 1.2, "Flag & Quarantine in Human Review Queue\nCandidate kept unmerged until verified by Investigator", ha='center', va='center', color='#9a3412', fontsize=8, fontweight='bold', multialignment='center')

    # Arrows from diamond to branches
    ax.annotate('YES', xy=(4.1, 1.6), xytext=(12.0, 1.89),
                arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=1.5, headwidth=6),
                color='#065f46', fontsize=8, fontweight='bold')
    ax.annotate('AMBIGUOUS', xy=(11.05, 1.6), xytext=(12.8, 1.89),
                arrowprops=dict(facecolor='#ea580c', edgecolor='#ea580c', width=1.5, headwidth=6),
                color='#9a3412', fontsize=8, fontweight='bold')

    # Red dashed arrow from pipeline complete up to WebSocket
    ax.annotate('', xy=(10.1, 6.0), xytext=(11.05, 0.8),
                arrowprops=dict(facecolor='#dc2626', edgecolor='#dc2626', width=1.5, headwidth=6, linestyle='dashed'))
    ax.text(12.8, 4.0, "Real-time Notification Trigger", color='#dc2626', fontsize=8.5, fontweight='bold', rotation=90)

    plt.tight_layout()
    out_path = 'd:/project/Crimenet/diagrams_v2/slide3_swimlane.png'
    plt.savefig(out_path, dpi=300, bbox_inches='tight', facecolor='#f8fafc')
    plt.close()
    print(f"Generated {out_path}")

generate_slide2_workflow()
generate_slide3_swimlane()
