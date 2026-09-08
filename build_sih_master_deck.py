import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs("d:/project/Crimenet/diagrams", exist_ok=True)

# -------------------------------------------------------------
# 1. GENERATE HIGH-RES VISUAL DIAGRAMS (Matplotlib)
# -------------------------------------------------------------

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['font.family'] = 'sans-serif'

def generate_slide1_problem_diagram():
    """Generates the visual fragment data diagram for Slide 1"""
    fig, ax = plt.subplots(figsize=(11.5, 3.2), dpi=300)
    fig.patch.set_facecolor('#0F172A')
    ax.set_facecolor('#0F172A')

    sources = ["POLICE FIRs", "TELECOM CDRs", "BANKING LEDGERS", "EMAILS & COMMS", "LEGAL DOSSIERS"]
    icons = ["[FIR]", "[CDR]", "[AML]", "[MSG]", "[DOC]"]
    
    # 5 source boxes
    x_positions = [0.8, 3.1, 5.4, 7.7, 10.0]
    for i, (name, icon, x) in enumerate(zip(sources, icons, x_positions)):
        # Box
        rect = patches.FancyBboxPatch(
            (x - 0.95, 2.1), 1.9, 0.8,
            boxstyle="round,pad=0.04,rounding_size=0.08",
            linewidth=1.2, edgecolor='#38BDF8', facecolor='#1E293B'
        )
        ax.add_patch(rect)
        ax.text(x, 2.58, icon, ha='center', va='center', color='#38BDF8', fontsize=8.5, fontweight='bold')
        ax.text(x, 2.30, name, ha='center', va='center', color='#F8FAFC', fontsize=7.2, fontweight='bold')
        
        # Arrow pointing down to fragment collector
        ax.annotate('', xy=(5.4, 1.45), xytext=(x, 2.05),
                    arrowprops=dict(arrowstyle="->", color="#64748B", lw=1.4, ls="--"))

    # Fragmented Problem Banner
    prob_rect = patches.FancyBboxPatch(
        (1.5, 0.75), 7.8, 0.65,
        boxstyle="round,pad=0.05,rounding_size=0.1",
        linewidth=1.5, edgecolor='#EF4444', facecolor='#450A0A'
    )
    ax.add_patch(prob_rect)
    ax.text(5.4, 1.15, "[!]  FRAGMENTED EVIDENCE & SILOED COGNITIVE LOAD", ha='center', va='center', color='#FCA5A5', fontsize=8.8, fontweight='bold')
    ax.text(5.4, 0.90, "Investigators must manually correlate names, numbers, accounts & shell entities across files", ha='center', va='center', color='#E2E8F0', fontsize=7.2)

    # Down arrow
    ax.annotate('', xy=(5.4, 0.05), xytext=(5.4, 0.70),
                arrowprops=dict(arrowstyle="-|>", color="#10B981", lw=2.2, mutation_scale=12))

    ax.set_xlim(0, 10.8)
    ax.set_ylim(0, 3.2)
    ax.axis('off')
    plt.tight_layout()
    out_path = "d:/project/Crimenet/diagrams/slide1_problem_diagram.png"
    plt.savefig(out_path, bbox_inches='tight', dpi=300, facecolor='#0F172A')
    plt.close()
    print(f"Generated {out_path}")

def generate_slide2_pipeline_diagram():
    """Generates the 6-stage core pipeline diagram for Slide 2"""
    fig, ax = plt.subplots(figsize=(11.8, 2.2), dpi=300)
    fig.patch.set_facecolor('#0F172A')
    ax.set_facecolor('#0F172A')

    nodes = [
        ("MULTI-SOURCE DATA", "FIR • CDR • Email\nFinancial • Legal", "#38BDF8", "#0C4A6E"),
        ("EXTRACTION / NER", "InLegalNER (BNS)\nWhisper ASR", "#0D9488", "#134E4A"),
        ("ENTITY RESOLUTION", "0.55 Lexical +\n0.45 Structural", "#6366F1", "#312E81"),
        ("KNOWLEDGE GRAPH", "Neo4j Graph DB\nOutbox Sync", "#8B5CF6", "#4C1D95"),
        ("GraphRAG + HITL", "Quarantine Review\nEvidence Citations", "#EC4899", "#831843"),
        ("INVESTIGATOR", "Actionable Insight\nDetective Canvas", "#10B981", "#064E3B")
    ]

    w = 1.62
    h = 1.55
    spacing = 1.95
    start_x = 0.25

    for i, (title, desc, stroke, fill) in enumerate(nodes):
        x = start_x + i * spacing
        y = 0.3

        rect = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.04,rounding_size=0.1",
            linewidth=1.4, edgecolor=stroke, facecolor=fill
        )
        ax.add_patch(rect)

        # Title
        ax.text(x + w/2, y + h - 0.35, title, ha='center', va='center', color=stroke, fontsize=7.2, fontweight='bold')
        # Desc
        ax.text(x + w/2, y + h - 0.95, desc, ha='center', va='center', color='#F8FAFC', fontsize=6.5, linespacing=1.3)

        # Connector
        if i < len(nodes) - 1:
            ax.annotate('', xy=(x + w + 0.28, y + h/2), xytext=(x + w + 0.05, y + h/2),
                        arrowprops=dict(arrowstyle="-|>", color="#94A3B8", lw=1.8, mutation_scale=10))

    ax.set_xlim(0, 11.8)
    ax.set_ylim(0, 2.2)
    ax.axis('off')
    plt.tight_layout()
    out_path = "d:/project/Crimenet/diagrams/slide2_pipeline.png"
    plt.savefig(out_path, bbox_inches='tight', dpi=300, facecolor='#0F172A')
    plt.close()
    print(f"Generated {out_path}")

def generate_slide3_architecture_diagram():
    """Generates the 4-layer architecture diagram for Slide 3"""
    fig, ax = plt.subplots(figsize=(11.8, 3.2), dpi=300)
    fig.patch.set_facecolor('#0F172A')
    ax.set_facecolor('#0F172A')

    layers = [
        ("INVESTIGATION LAYER", ["Interactive Detective Corkboard", "GraphRAG Grounded Citations", "Louvain Community Detection", "HITL Review Queue"], "#10B981", "#064E3B"),
        ("KNOWLEDGE LAYER", ["Neo4j Graph Database", "PostgreSQL 16 Relational DB", "Transactional Outbox Engine", "SHA-256 Provenance Ledger"], "#8B5CF6", "#4C1D95"),
        ("INTELLIGENCE LAYER", ["InLegalNER (BNS 2024 / IPC)", "Whisper-v3 Speech ASR", "FastEmbed Dense Embeddings", "Probabilistic Entity Resolution"], "#0D9488", "#134E4A"),
        ("DATA SOURCES LAYER", ["Police FIRs (.pdf/.txt)", "Telecom CDR Spreadsheets", "Banking AML Ledgers", "Intercepted Audio Wiretaps"], "#38BDF8", "#0C4A6E")
    ]

    w = 11.2
    h = 0.58
    y_start = 2.45
    y_gap = 0.75

    for i, (layer_name, components, stroke, fill) in enumerate(layers):
        y = y_start - i * y_gap

        # Outer Layer Box
        rect = patches.FancyBboxPatch(
            (0.3, y), w, h,
            boxstyle="round,pad=0.04,rounding_size=0.08",
            linewidth=1.4, edgecolor=stroke, facecolor=fill
        )
        ax.add_patch(rect)

        # Label Pill
        label_rect = patches.FancyBboxPatch(
            (0.4, y + 0.08), 2.3, h - 0.16,
            boxstyle="round,pad=0.02,rounding_size=0.06",
            linewidth=0, facecolor=stroke
        )
        ax.add_patch(label_rect)
        ax.text(1.55, y + h/2, layer_name, ha='center', va='center', color='#FFFFFF', fontsize=7.2, fontweight='bold')

        # Component Pills
        comp_w = 1.95
        comp_start_x = 2.95
        for c_idx, comp in enumerate(components):
            cx = comp_start_x + c_idx * 2.12
            pill = patches.FancyBboxPatch(
                (cx, y + 0.09), comp_w, h - 0.18,
                boxstyle="round,pad=0.02,rounding_size=0.06",
                linewidth=0.8, edgecolor=stroke, facecolor='#0F172A'
            )
            ax.add_patch(pill)
            ax.text(cx + comp_w/2, y + h/2, comp, ha='center', va='center', color='#E2E8F0', fontsize=6.6, fontweight='bold')

    # Connecting arrows between layers
    for i in range(3):
        arr_y = y_start - i * y_gap
        ax.annotate('', xy=(5.9, arr_y - 0.14), xytext=(5.9, arr_y + 0.02),
                    arrowprops=dict(arrowstyle="<->", color="#94A3B8", lw=1.2))

    ax.set_xlim(0, 11.8)
    ax.set_ylim(0, 3.2)
    ax.axis('off')
    plt.tight_layout()
    out_path = "d:/project/Crimenet/diagrams/slide3_architecture.png"
    plt.savefig(out_path, bbox_inches='tight', dpi=300, facecolor='#0F172A')
    plt.close()
    print(f"Generated {out_path}")

# -------------------------------------------------------------
# 2. BUILD THE 6-SLIDE POWERPOINT PRESENTATION
# -------------------------------------------------------------

def build_master_presentation():
    input_path = "d:/project/Crimenet/SIH2026-IDEA-Presentation-Format.pptx"
    output_path = "d:/project/Crimenet/SIH2026_VEILLE_Master_Deck.pptx"

    prs = pptx.Presentation(input_path)

    # Keep exactly 6 slides
    while len(prs.slides) > 6:
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]

    # Color Palette - Dark Tactical Theme
    BG_DARK = RGBColor(11, 17, 30)       # #0B111E
    CARD_BG = RGBColor(18, 28, 48)       # #121C30
    CARD_BORDER = RGBColor(30, 45, 75)   # #1E2D4B
    ACCENT_EMERALD = RGBColor(16, 185, 129) # #10B981
    ACCENT_CYAN = RGBColor(56, 189, 248)    # #38BDF8
    TEXT_WHITE = RGBColor(248, 250, 252)   # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8
    TEXT_AMBER = RGBColor(251, 191, 36)    # #FBBF24

    def apply_dark_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_DARK

    def clean_slide_shapes(slide):
        """Removes template placeholder clutter while keeping slide numbers & badges."""
        for shape in list(slide.shapes):
            if shape.name.startswith("Picture") or shape.name.startswith("Slide Number"):
                continue
            if shape.has_text_frame and "@SIH" in shape.text_frame.text:
                continue
            # Delete other text boxes / shapes to avoid ghost placeholders
            sp = shape._element
            sp.getparent().remove(sp)

    def add_header(slide, category_tag, slide_title):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.28), Inches(11.0), Inches(0.35))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = category_tag.upper()
        p_tag.font.name = "Arial"
        p_tag.font.size = Pt(9.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = ACCENT_CYAN

        # Main Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.55), Inches(11.0), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = slide_title
        p_title.font.name = "Arial"
        p_title.font.size = Pt(20)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

    # ==========================================
    # SLIDE 1 — THE PROBLEM
    # ==========================================
    s1 = prs.slides[0]
    apply_dark_background(s1)
    clean_slide_shapes(s1)

    add_header(s1, "VEILLE // THE PROBLEM", "From Fragmented Evidence to Actionable Intelligence")

    # Big Statement Card
    stmt_shape = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.25), Inches(12.13), Inches(0.95))
    stmt_shape.fill.solid()
    stmt_shape.fill.fore_color.rgb = CARD_BG
    stmt_shape.line.color.rgb = CARD_BORDER
    stmt_shape.line.width = Pt(1.5)

    tf_stmt = stmt_shape.text_frame
    tf_stmt.word_wrap = True
    p_stmt = tf_stmt.paragraphs[0]
    p_stmt.text = "“ Investigations rarely fail because data is unavailable.\nThey fail because the data is fragmented, heterogeneous, and difficult to connect. ”"
    p_stmt.font.name = "Arial"
    p_stmt.font.size = Pt(13)
    p_stmt.font.bold = True
    p_stmt.font.color.rgb = TEXT_AMBER
    p_stmt.alignment = PP_ALIGN.CENTER

    # Insert Visual Problem Flow Diagram
    diag1_path = "d:/project/Crimenet/diagrams/slide1_problem_diagram.png"
    if os.path.exists(diag1_path):
        s1.shapes.add_picture(diag1_path, Inches(0.6), Inches(2.35), Inches(12.13), Inches(3.2))

    # Bottom Line Banner
    hero_shape = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.70), Inches(12.13), Inches(0.95))
    hero_shape.fill.solid()
    hero_shape.fill.fore_color.rgb = RGBColor(6, 78, 59)
    hero_shape.line.color.rgb = ACCENT_EMERALD
    hero_shape.line.width = Pt(1.5)

    tf_hero = hero_shape.text_frame
    tf_hero.word_wrap = True
    p_hero = tf_hero.paragraphs[0]
    p_hero.text = "BOTTOM LINE:  VEILLE converts disconnected evidence into a traceable, mathematically grounded investigation graph."
    p_hero.font.name = "Arial"
    p_hero.font.size = Pt(13)
    p_hero.font.bold = True
    p_hero.font.color.rgb = TEXT_WHITE
    p_hero.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 2 — OUR SOLUTION
    # ==========================================
    s2 = prs.slides[1]
    apply_dark_background(s2)
    clean_slide_shapes(s2)

    add_header(s2, "VEILLE // OUR SOLUTION", "VEILLE — Forensic Intelligence Fusion Platform")

    # One-line pitch strip
    pitch_shape = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.25), Inches(12.13), Inches(0.55))
    pitch_shape.fill.solid()
    pitch_shape.fill.fore_color.rgb = CARD_BG
    pitch_shape.line.color.rgb = CARD_BORDER
    tf_pitch = pitch_shape.text_frame
    tf_pitch.word_wrap = True
    p_pitch = tf_pitch.paragraphs[0]
    p_pitch.text = "CORE WORKFLOW:   Ingest  ➔  Extract  ➔  Resolve  ➔  Connect  ➔  Verify  ➔  Investigate"
    p_pitch.font.name = "Arial"
    p_pitch.font.size = Pt(11.5)
    p_pitch.font.bold = True
    p_pitch.font.color.rgb = ACCENT_CYAN
    p_pitch.alignment = PP_ALIGN.CENTER

    # Pipeline Diagram
    diag2_path = "d:/project/Crimenet/diagrams/slide2_pipeline.png"
    if os.path.exists(diag2_path):
        s2.shapes.add_picture(diag2_path, Inches(0.6), Inches(1.95), Inches(12.13), Inches(2.45))

    # 3 Capability Cards
    caps = [
        ("⚡ FUSE", "Heterogeneous Evidence → Unified Graph", "Ingests disparate Police FIRs, telecom CDR spreadsheets, banking ledgers, and wiretaps into a structured relational knowledge graph."),
        ("🎯 RESOLVE", "Aliases & Noisy Identities → Safe Matching", "0.55 Lexical + 0.45 Structural scoring with strict HITL quarantine prevents accidental false merges while linking aliases."),
        ("🔎 VERIFY", "Claims → Graph + Evidence → Traceable Answers", "Evidence-grounded citations prove every edge and claim with SHA-256 hash provenance — zero black-box assertions.")
    ]

    for i, (head, subhead, desc) in enumerate(caps):
        cx = Inches(0.6 + i * 4.11)
        c_shape = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, Inches(4.55), Inches(3.9), Inches(2.2))
        c_shape.fill.solid()
        c_shape.fill.fore_color.rgb = CARD_BG
        c_shape.line.color.rgb = CARD_BORDER
        c_shape.line.width = Pt(1.2)

        tf_c = c_shape.text_frame
        tf_c.word_wrap = True
        p1 = tf_c.paragraphs[0]
        p1.text = head
        p1.font.name = "Arial"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_EMERALD

        p2 = tf_c.add_paragraph()
        p2.space_before = Pt(3)
        p2.text = subhead
        p2.font.name = "Arial"
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = ACCENT_CYAN

        p3 = tf_c.add_paragraph()
        p3.space_before = Pt(4)
        p3.text = desc
        p3.font.name = "Arial"
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 3 — HOW VEILLE WORKS (Technical Architecture)
    # ==========================================
    s3 = prs.slides[2]
    apply_dark_background(s3)
    clean_slide_shapes(s3)

    add_header(s3, "VEILLE // TECHNICAL ARCHITECTURE", "Evidence ➔ Entity ➔ Relationship ➔ Intelligence")

    # 4-Layer Architecture Diagram
    diag3_path = "d:/project/Crimenet/diagrams/slide3_architecture.png"
    if os.path.exists(diag3_path):
        s3.shapes.add_picture(diag3_path, Inches(0.6), Inches(1.30), Inches(12.13), Inches(3.8))

    # Architecture Footer Strip
    arch_foot = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.35), Inches(12.13), Inches(1.35))
    arch_foot.fill.solid()
    arch_foot.fill.fore_color.rgb = CARD_BG
    arch_foot.line.color.rgb = CARD_BORDER
    tf_af = arch_foot.text_frame
    tf_af.word_wrap = True
    
    p_af1 = tf_af.paragraphs[0]
    p_af1.text = "DATA FLOW & DECOUPLING PHILOSOPHY"
    p_af1.font.name = "Arial"
    p_af1.font.size = Pt(11)
    p_af1.font.bold = True
    p_af1.font.color.rgb = ACCENT_EMERALD

    p_af2 = tf_af.add_paragraph()
    p_af2.space_before = Pt(3)
    p_af2.text = "• PostgreSQL 16 acts as the transactional system of record and outbox queue; Neo4j maintains the live topological knowledge graph.\n• Slow AI extraction (InLegalNER & Whisper ASR) is fully decoupled via Celery workers from the fast interactive React 19 UI.\n• Tech Stack: React 19 • FastAPI • PostgreSQL 16 • Neo4j GDS • Redis • Celery • FastEmbed / Gemini"
    p_af2.font.name = "Arial"
    p_af2.font.size = Pt(9.5)
    p_af2.font.color.rgb = TEXT_WHITE

    # ==========================================
    # SLIDE 4 — THE DIFFERENTIATOR
    # ==========================================
    s4 = prs.slides[3]
    apply_dark_background(s4)
    clean_slide_shapes(s4)

    add_header(s4, "VEILLE // CORE DIFFERENTIATORS", "Why VEILLE Is Different")

    diff_cards = [
        ("🧠 01 — Conservative Entity Resolution", 
         "0.55 Lexical + 0.45 Structural Scoring Model",
         "• 'Vikram Mehta', 'V. Mehta', 'Vikram M.' evaluated on name similarity + shared phone/account context.\n• Score ≥ 0.85 ➔ Auto-Merge | Score 0.50–0.85 ➔ HITL Review Quarantine | Score < 0.50 ➔ Separate Entity.\n• Strict conservative policy: Eliminates wrongful false merges in forensic settings."),
        
        ("🔗 02 — Structured Knowledge Graph", 
         "Rich Typed Ontologies over Flat Mentions",
         "• Replaces naive 'Person A appears in Document B' with rich semantic relationships:\n• Person  ➔  COMMUNICATES_WITH (Calls/SMS)  ➔  Person\n• Person  ➔  OWNS  ➔  Bank Account  |  LOCATED_AT  ➔  Tower Node\n• Person  ➔  OFFICER_OF  ➔  Shell Organization / Front Company"),
        
        ("🔍 03 — Claim-Level GraphRAG", 
         "Deterministic Grounding vs. Black-Box Assertions",
         "• Never: 'AI thinks this person is suspicious.'\n• Instead: User Query ➔ Subgraph Traversal ➔ Verifiable Evidence Spans ➔ Claim Verification.\n• Output categorized strictly: SUPPORTED • PARTIALLY SUPPORTED • CONTRADICTED.\n• Strict boundary: Replies 'Out-of-Scope' if query is outside evidentiary facts."),
        
        ("👤 04 — Human-in-the-Loop (HITL)", 
         "AI Proposes. Investigator Decides.",
         "• Ambiguous relationship links remain quarantined as candidate suggestions until officer confirmation.\n• Zero automated arrests or warrants: Built as an intelligence exoskeleton, preserving human accountability.\n• Court-admissible Section 65B BSA compliance with SHA-256 immutable audit logs.")
    ]

    for i, (head, subhead, body) in enumerate(diff_cards):
        col = i % 2
        row = i // 2
        cx = Inches(0.6 + col * 6.16)
        cy = Inches(1.30 + row * 2.72)
        
        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, Inches(5.97), Inches(2.55))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.2)

        tf_d = card.text_frame
        tf_d.word_wrap = True
        
        p1 = tf_d.paragraphs[0]
        p1.text = head
        p1.font.name = "Arial"
        p1.font.size = Pt(11.5)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_CYAN if i % 2 == 0 else ACCENT_EMERALD

        p2 = tf_d.add_paragraph()
        p2.space_before = Pt(2)
        p2.text = subhead
        p2.font.name = "Arial"
        p2.font.size = Pt(9)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_AMBER

        p3 = tf_d.add_paragraph()
        p3.space_before = Pt(4)
        p3.text = body
        p3.font.name = "Arial"
        p3.font.size = Pt(8.2)
        p3.font.color.rgb = TEXT_WHITE
        p3.line_spacing = 1.15

    # ==========================================
    # SLIDE 5 — VALIDATION (Proof & Real Benchmarks)
    # ==========================================
    s5 = prs.slides[4]
    apply_dark_background(s5)
    clean_slide_shapes(s5)

    add_header(s5, "VEILLE // EMPIRICAL VALIDATION", "We Don't Just Demo It — We Measure It")

    # 4 Big Stat Numbers (from real committed er_results.json)
    metrics = [
        ("536", "Controlled Benchmark Pairs", "Evaluated across Alias, Abbreviation, Initial & Typo test categories"),
        ("100%", "Auto-Merge Precision", "238 True Positives with exactly 0 False Positives committed to graph"),
        ("0%", "False Merge Rate", "Zero accidental wrongful identity merges (Critical for forensic reliability)"),
        ("17.91%", "Sent to HITL Review", "96 ambiguous candidate pairs safely quarantined for investigator review")
    ]

    for i, (val, title, subtitle) in enumerate(metrics):
        cx = Inches(0.6 + i * 3.08)
        m_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, Inches(1.30), Inches(2.9), Inches(2.3))
        m_box.fill.solid()
        m_box.fill.fore_color.rgb = CARD_BG
        m_box.line.color.rgb = CARD_BORDER
        m_box.line.width = Pt(1.5)

        tf_m = m_box.text_frame
        tf_m.word_wrap = True
        
        p_val = tf_m.paragraphs[0]
        p_val.text = val
        p_val.font.name = "Arial"
        p_val.font.size = Pt(28)
        p_val.font.bold = True
        p_val.font.color.rgb = ACCENT_EMERALD if i in (1, 2) else ACCENT_CYAN
        p_val.alignment = PP_ALIGN.CENTER

        p_t = tf_m.add_paragraph()
        p_t.space_before = Pt(4)
        p_t.text = title
        p_t.font.name = "Arial"
        p_t.font.size = Pt(10)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.alignment = PP_ALIGN.CENTER

        p_st = tf_m.add_paragraph()
        p_st.space_before = Pt(3)
        p_st.text = subtitle
        p_st.font.name = "Arial"
        p_st.font.size = Pt(7.8)
        p_st.font.color.rgb = TEXT_MUTED
        p_st.alignment = PP_ALIGN.CENTER

    # Multi-Tier Real Dataset Validation Strip
    tier_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(3.80), Inches(12.13), Inches(1.85))
    tier_box.fill.solid()
    tier_box.fill.fore_color.rgb = CARD_BG
    tier_box.line.color.rgb = CARD_BORDER
    tf_tb = tier_box.text_frame
    tf_tb.word_wrap = True

    p_th = tf_tb.paragraphs[0]
    p_th.text = "MULTI-TIER VALIDATION CORPORA (Real-World & Controlled Ground Truth)"
    p_th.font.name = "Arial"
    p_th.font.size = Pt(10.5)
    p_th.font.bold = True
    p_th.font.color.rgb = TEXT_AMBER

    datasets = [
        ("InLegalNER Corpus", "Real Indian Judicial High Court & FIR judgments for BNS / IPC legal entities"),
        ("ICIJ Bahamas Leaks", "Real-world offshore shell company networks and nominee director filings"),
        ("Enron / CMU Corpus", "Real communication graph tracking email hierarchies & burner aliases"),
        ("IBM AMLWorld / Telecom", "Complex synthetic money-laundering smurfing & multi-hop CDR telephony matrices"),
        ("Storm Watch Benchmark", "Controlled ground truth evaluating edge boundary accuracy & entity resolution")
    ]

    for d_name, d_desc in datasets:
        p_d = tf_tb.add_paragraph()
        p_d.space_before = Pt(2)
        p_d.text = f"•  {d_name}: {d_desc}"
        p_d.font.name = "Arial"
        p_d.font.size = Pt(8.5)
        p_d.font.color.rgb = TEXT_WHITE

    # Bottom Provenance Verification
    prov_bar = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.80), Inches(12.13), Inches(0.85))
    prov_bar.fill.solid()
    prov_bar.fill.fore_color.rgb = RGBColor(12, 45, 75)
    prov_bar.line.color.rgb = ACCENT_CYAN
    tf_pb = prov_bar.text_frame
    tf_pb.word_wrap = True
    p_pb = tf_pb.paragraphs[0]
    p_pb.text = "🔒 PROVENANCE SEAL: Every benchmark dataset and evaluation run is tracked with tamper-evident metadata and SHA-256 cryptographic verification."
    p_pb.font.name = "Arial"
    p_pb.font.size = Pt(10)
    p_pb.font.bold = True
    p_pb.font.color.rgb = ACCENT_CYAN
    p_pb.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 6 — IMPACT + ROADMAP
    # ==========================================
    s6 = prs.slides[5]
    apply_dark_background(s6)
    clean_slide_shapes(s6)

    add_header(s6, "VEILLE // IMPACT & ROADMAP", "From Evidence Overload to Investigative Advantage")

    # Left Box: Impact (4 Key Pillars)
    left_shape = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.30), Inches(5.95), Inches(3.90))
    left_shape.fill.solid()
    left_shape.fill.fore_color.rgb = CARD_BG
    left_shape.line.color.rgb = CARD_BORDER
    left_shape.line.width = Pt(1.4)
    tf_l = left_shape.text_frame
    tf_l.word_wrap = True

    p_lh = tf_l.paragraphs[0]
    p_lh.text = "INVESTIGATIVE IMPACT"
    p_lh.font.name = "Arial"
    p_lh.font.size = Pt(12)
    p_lh.font.bold = True
    p_lh.font.color.rgb = ACCENT_EMERALD

    impacts = [
        ("⚡ Faster Investigation", "Automatically connect entities across fragmented FIRs, CDRs, and banking statements in seconds instead of weeks."),
        ("🎯 Safer Decisions", "Conservative Entity Resolution + HITL review queue prevents dangerous wrongful associations and investigative bias."),
        ("🔎 Explainable Intelligence", "Every conclusion, connection, and graph edge can be traced back to its raw source evidence span with cryptographic hashes."),
        ("📈 Scalable Architecture", "Canonical adapter layer ingests standard police data (CCTNS / ICJS) without requiring proprietary schema changes.")
    ]

    for title, desc in impacts:
        p_it = tf_l.add_paragraph()
        p_it.space_before = Pt(4)
        p_it.text = title
        p_it.font.name = "Arial"
        p_it.font.size = Pt(9.5)
        p_it.font.bold = True
        p_it.font.color.rgb = TEXT_WHITE

        p_id = tf_l.add_paragraph()
        p_id.space_before = Pt(1)
        p_id.text = desc
        p_id.font.name = "Arial"
        p_id.font.size = Pt(8.2)
        p_id.font.color.rgb = TEXT_MUTED

    # Right Box: Strategic Roadmap
    right_shape = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), Inches(1.30), Inches(5.95), Inches(3.90))
    right_shape.fill.solid()
    right_shape.fill.fore_color.rgb = CARD_BG
    right_shape.line.color.rgb = CARD_BORDER
    right_shape.line.width = Pt(1.4)
    tf_r = right_shape.text_frame
    tf_r.word_wrap = True

    p_rh = tf_r.paragraphs[0]
    p_rh.text = "STRATEGIC ROADMAP"
    p_rh.font.name = "Arial"
    p_rh.font.size = Pt(12)
    p_rh.font.bold = True
    p_rh.font.color.rgb = ACCENT_CYAN

    roadmap = [
        ("TODAY (Working Prototype & Core Engine)", "• Multi-source Ingestion (FIR, CDR, AML, Wiretaps)\n• InLegalNER & Whisper ASR Extraction\n• Hybrid Entity Resolution (0.55/0.45) & HITL Review\n• Neo4j Graph Topology + Louvain / PageRank GDS\n• Claim-Level GraphRAG w/ Evidence Citations"),
        ("NEXT (Production Rollout & Enhancements)", "• Fine-Tuned Regional Indian Language Legal NER\n• Advanced Temporal Sequence & Movement Extraction\n• Automated Section 65B Electronic Evidence Dossier Gen\n• Interoperability with State CCTNS / ICJS Police Hubs")
    ]

    for title, desc in roadmap:
        p_rt = tf_r.add_paragraph()
        p_rt.space_before = Pt(4)
        p_rt.text = title
        p_rt.font.name = "Arial"
        p_rt.font.size = Pt(9.5)
        p_rt.font.bold = True
        p_rt.font.color.rgb = TEXT_AMBER

        p_rd = tf_r.add_paragraph()
        p_rd.space_before = Pt(1)
        p_rd.text = desc
        p_rd.font.name = "Arial"
        p_rd.font.size = Pt(8.2)
        p_rd.font.color.rgb = TEXT_WHITE

    # Bottom Final Hero Statement
    final_box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.35), Inches(12.13), Inches(0.85))
    final_box.fill.solid()
    final_box.fill.fore_color.rgb = RGBColor(6, 78, 59)
    final_box.line.color.rgb = ACCENT_EMERALD
    final_box.line.width = Pt(1.5)
    tf_fb = final_box.text_frame
    tf_fb.word_wrap = True
    
    p_fb1 = tf_fb.paragraphs[0]
    p_fb1.text = "“ VEILLE doesn't replace the investigator. It gives the investigator a connected view of the evidence. ”"
    p_fb1.font.name = "Arial"
    p_fb1.font.size = Pt(12)
    p_fb1.font.bold = True
    p_fb1.font.color.rgb = TEXT_WHITE
    p_fb1.alignment = PP_ALIGN.CENTER

    p_fb2 = tf_fb.add_paragraph()
    p_fb2.space_before = Pt(2)
    p_fb2.text = "VEILLE // See the connections. Verify the evidence. Act with confidence."
    p_fb2.font.name = "Arial"
    p_fb2.font.size = Pt(9.5)
    p_fb2.font.bold = True
    p_fb2.font.color.rgb = ACCENT_CYAN
    p_fb2.alignment = PP_ALIGN.CENTER

    prs.save(output_path)
    print(f"\n Master presentation generated successfully: {output_path}")

if __name__ == "__main__":
    generate_slide1_problem_diagram()
    generate_slide2_pipeline_diagram()
    generate_slide3_architecture_diagram()
    build_master_presentation()
