import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_slide3_swimlane_clean():
    fig, ax = plt.subplots(figsize=(15, 9), dpi=300)
    ax.set_facecolor('#ffffff')
    fig.patch.set_facecolor('#ffffff')
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 9)
    ax.axis('off')

    # Main Title
    ax.text(7.5, 8.65, "Evidence Processing & Knowledge Graph Updates: Asynchronous Flowchart",
            ha='center', va='center', color='#0f172a', fontsize=15, fontweight='bold')

    # Top Left Lane: Gateway & Ingestion (Sky Blue)
    lane1 = patches.FancyBboxPatch((0.4, 5.2), 7.0, 3.1, boxstyle="round,pad=0.06,rounding_size=0.15",
                                  facecolor='#f0f9ff', edgecolor='#0284c7', linewidth=1.5)
    ax.add_patch(lane1)
    ax.text(0.6, 8.0, "1. Ingestion & API Gateway (FastAPI)", ha='left', va='center', color='#0369a1', fontsize=11, fontweight='bold')

    s1 = patches.FancyBboxPatch((0.7, 7.1), 6.4, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#38bdf8')
    ax.add_patch(s1)
    ax.text(3.9, 7.42, "Investigator uploads PDF / CDR / Bank CSV / Cell Tower Logs", ha='center', va='center', color='#0f172a', fontsize=8.5)

    s2 = patches.FancyBboxPatch((0.7, 6.25), 6.4, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#38bdf8')
    ax.add_patch(s2)
    ax.text(3.9, 6.57, "Calculate SHA-256 Hash + Store in Vault + Log Audit Trail", ha='center', va='center', color='#0f172a', fontsize=8.5)

    s3 = patches.FancyBboxPatch((0.7, 5.4), 6.4, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#38bdf8')
    ax.add_patch(s3)
    ax.text(3.9, 5.72, "Dispatch Task to Asynchronous Pipeline (Returns 202 Accepted)", ha='center', va='center', color='#0f172a', fontsize=8.5)

    # Arrows inside Lane 1
    ax.annotate('', xy=(3.9, 6.9), xytext=(3.9, 7.1), arrowprops=dict(facecolor='#0284c7', edgecolor='#0284c7', width=1.5, headwidth=5))
    ax.annotate('', xy=(3.9, 6.05), xytext=(3.9, 6.25), arrowprops=dict(facecolor='#0284c7', edgecolor='#0284c7', width=1.5, headwidth=5))

    # Top Right Lane: Realtime UX Sync (Slate Grey)
    lane2 = patches.FancyBboxPatch((7.6, 5.2), 7.0, 3.1, boxstyle="round,pad=0.06,rounding_size=0.15",
                                  facecolor='#f8fafc', edgecolor='#64748b', linewidth=1.5)
    ax.add_patch(lane2)
    ax.text(7.8, 8.0, "2. Realtime Non-Blocking UX (React 18 Canvas)", ha='left', va='center', color='#334155', fontsize=11, fontweight='bold')

    ux1 = patches.FancyBboxPatch((7.9, 7.1), 6.4, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#94a3b8')
    ax.add_patch(ux1)
    ax.text(11.1, 7.42, "Investigator UI tracks Job ID non-blocking (Free to query other cases)", ha='center', va='center', color='#0f172a', fontsize=8.2)

    ux2 = patches.FancyBboxPatch((7.9, 6.25), 6.4, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#94a3b8')
    ax.add_patch(ux2)
    ax.text(11.1, 6.57, "WebSocket Notification received: 'Graph Processing Complete'", ha='center', va='center', color='#0f172a', fontsize=8.2)

    ux3 = patches.FancyBboxPatch((7.9, 5.4), 6.4, 0.65, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ecfdf5', edgecolor='#10b981')
    ax.add_patch(ux3)
    ax.text(11.1, 5.72, "Canvas Live Sync: Auto-highlights New Entities & Suspect Clusters", ha='center', va='center', color='#065f46', fontsize=8.5, fontweight='bold')

    # Arrow from Ingestion to UX track
    ax.annotate('', xy=(7.9, 7.42), xytext=(7.1, 5.72),
                arrowprops=dict(facecolor='#64748b', edgecolor='#64748b', width=1.5, headwidth=6, linestyle='dashed'))
    ax.annotate('', xy=(11.1, 6.9), xytext=(11.1, 7.1), arrowprops=dict(facecolor='#64748b', edgecolor='#64748b', width=1.5, headwidth=5))
    ax.annotate('', xy=(11.1, 6.05), xytext=(11.1, 6.25), arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=1.5, headwidth=5))

    # Bottom Lane: Background Intelligence & Entity Resolution Engine (Emerald Green)
    lane3 = patches.FancyBboxPatch((0.4, 0.3), 14.2, 4.6, boxstyle="round,pad=0.06,rounding_size=0.15",
                                  facecolor='#f0fdf4', edgecolor='#16a34a', linewidth=1.5)
    ax.add_patch(lane3)
    ax.text(0.6, 4.6, "3. Asynchronous Intelligence, Extraction & Entity Resolution (Air-Gapped Engine)", ha='left', va='center', color='#15803d', fontsize=11, fontweight='bold')

    # NLP & Extraction Box
    nlp_box = patches.FancyBboxPatch((0.7, 3.65), 13.6, 0.7, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#22c55e')
    ax.add_patch(nlp_box)
    ax.text(7.5, 4.0, "Multi-Format Extraction: Tesseract OCR + Local Ollama LLM (Llama-3/Mistral) + FastNER Domain Rules -> Candidate Graph", ha='center', va='center', color='#0f172a', fontsize=8.8, fontweight='bold')

    # Arrow from Ingestion dispatch down to NLP box
    ax.annotate('', xy=(3.9, 4.35), xytext=(3.9, 5.4),
                arrowprops=dict(facecolor='#16a34a', edgecolor='#16a34a', width=2, headwidth=7))

    # Multi-factor ER Step
    er_box = patches.FancyBboxPatch((0.7, 2.65), 7.8, 0.75, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ffffff', edgecolor='#8b5cf6')
    ax.add_patch(er_box)
    ax.text(4.6, 3.02, "Hybrid Entity Resolution Engine\nPhonetic Double Metaphone + TF-IDF Blocking + Jaro-Winkler Alias Match", ha='center', va='center', color='#5b21b6', fontsize=8.2, fontweight='bold', multialignment='center')

    # Arrow from NLP down to ER
    ax.annotate('', xy=(4.6, 3.4), xytext=(4.6, 3.65),
                arrowprops=dict(facecolor='#8b5cf6', edgecolor='#8b5cf6', width=1.5, headwidth=6))

    # Decision Diamond
    diamond = patches.Polygon([[9.3, 3.02], [10.5, 3.37], [11.7, 3.02], [10.5, 2.67]], closed=True,
                              facecolor='#fef08a', edgecolor='#ca8a04', linewidth=1.5)
    ax.add_patch(diamond)
    ax.text(10.5, 3.02, "Confidence\n>= 0.85?", ha='center', va='center', color='#713f12', fontsize=8, fontweight='bold', multialignment='center')

    # Arrow ER to Diamond
    ax.annotate('', xy=(9.3, 3.02), xytext=(8.5, 3.02),
                arrowprops=dict(facecolor='#8b5cf6', edgecolor='#8b5cf6', width=1.5, headwidth=6))

    # Branch 1: Confirmed Merge -> Neo4j (Green Box bottom left)
    b1 = patches.FancyBboxPatch((0.7, 0.6), 6.5, 1.6, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#ecfdf5', edgecolor='#059669', linewidth=1.5)
    ax.add_patch(b1)
    ax.text(3.95, 1.85, "HIGH CONFIDENCE (>= 85%) -> AUTOMATIC FUSION", ha='center', va='center', color='#065f46', fontsize=9, fontweight='bold')
    ax.text(3.95, 1.4, "* Upsert Nodes & Relationships into Neo4j Graph DB\n* Attach SHA-256 Provenance & Section 65B Audit Trail\n* Compute Graph Metrics (Louvain Communities & PageRank)", ha='center', va='center', color='#0f172a', fontsize=7.8, multialignment='center')

    # Branch 2: Ambiguous -> Quarantine Queue (Orange Box bottom right)
    b2 = patches.FancyBboxPatch((7.8, 0.6), 6.5, 1.6, boxstyle="round,pad=0.04,rounding_size=0.1", facecolor='#fff7ed', edgecolor='#ea580c', linewidth=1.5)
    ax.add_patch(b2)
    ax.text(11.05, 1.85, "AMBIGUOUS (50-84%) -> HUMAN-IN-THE-LOOP (HITL)", ha='center', va='center', color='#9a3412', fontsize=9, fontweight='bold')
    ax.text(11.05, 1.4, "* Route to Postgres Quarantine Review Queue (17.91% of pairs)\n* Prevents 0% false merges / wrongful link convictions\n* Investigator accepts/rejects with single-click calibration", ha='center', va='center', color='#0f172a', fontsize=7.8, multialignment='center')

    # Arrows from diamond to branches
    ax.annotate('YES', xy=(3.95, 2.2), xytext=(9.7, 2.75),
                arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=1.5, headwidth=6),
                color='#065f46', fontsize=8.5, fontweight='bold')
    ax.annotate('UNCERTAIN', xy=(11.05, 2.2), xytext=(11.3, 2.75),
                arrowprops=dict(facecolor='#ea580c', edgecolor='#ea580c', width=1.5, headwidth=6),
                color='#9a3412', fontsize=8.5, fontweight='bold')

    # Dotted line notifying UI going around the right side
    ax.annotate('', xy=(11.1, 5.4), xytext=(11.05, 2.2),
                arrowprops=dict(facecolor='#dc2626', edgecolor='#dc2626', width=1.5, headwidth=6, linestyle='dashed'))
    ax.text(12.5, 3.8, "WebSocket Trigger", color='#dc2626', fontsize=8.5, fontweight='bold')

    plt.tight_layout()
    out_path = 'd:/project/Crimenet/diagrams_v2/slide3_swimlane.png'
    plt.savefig(out_path, dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()
    print(f"Generated clean {out_path}")

generate_slide3_swimlane_clean()
