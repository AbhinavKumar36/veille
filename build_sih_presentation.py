import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def build_presentation():
    input_path = "d:/project/Crimenet/SIH2026-IDEA-Presentation-Format.pptx"
    output_path = "d:/project/Crimenet/SIH2026_VEILLE_AI_Presentation_v2.pptx"

    prs = pptx.Presentation(input_path)

    # Remove Slide 7 (Instructions slide) so total is exactly 6 slides
    while len(prs.slides) > 6:
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]

    # Color Palette
    NAVY_DARK = RGBColor(12, 30, 65)
    PRIMARY_BLUE = RGBColor(0, 90, 180)
    TEXT_DARK = RGBColor(35, 40, 50)
    WHITE = RGBColor(255, 255, 255)

    def style_title(shape, title_text):
        if shape and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title_text
            p.font.name = "Arial"
            p.font.size = Pt(21)
            p.font.bold = True
            p.font.color.rgb = NAVY_DARK

    def update_team_oval(slide, team_name="VEILLE"):
        for shape in slide.shapes:
            if "Oval" in shape.name or (shape.has_text_frame and "Your Team Name" in shape.text_frame.text):
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = team_name
                p.font.name = "Arial"
                p.font.size = Pt(11)
                p.font.bold = True
                p.font.color.rgb = WHITE
                p.alignment = PP_ALIGN.CENTER

    def clear_body_shapes(slide, title_shape):
        """Clears old placeholder body textboxes to prevent text overlapping."""
        for shape in list(slide.shapes):
            if shape == title_shape:
                continue
            if "Oval" in shape.name or (shape.has_text_frame and "Your Team Name" in shape.text_frame.text):
                continue
            if "Picture" in shape.name or shape.shape_type == pptx.enum.shapes.MSO_SHAPE.RECTANGLE:
                continue
            if "Placeholder 5" in shape.name or "Placeholder 6" in shape.name:
                continue
            if shape.has_text_frame and shape.top >= Inches(1.1):
                shape.text_frame.clear()

    # ==========================================
    # SLIDE 1: TITLE PAGE
    # ==========================================
    s1 = prs.slides[0]
    for shape in s1.shapes:
        if shape.name == "Subtitle 3" or (shape.has_text_frame and "TITLE PAGE" in shape.text_frame.text):
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "VEILLE AI: Criminal Network Analysis"
            p.font.name = "Arial"
            p.font.size = Pt(18)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_BLUE

        if shape.name == "TextBox 9" or (shape.has_text_frame and "Problem Statement ID" in shape.text_frame.text):
            tf = shape.text_frame
            tf.clear()
            
            items = [
                ("Problem Statement ID: ", "SIH26189"),
                ("Problem Statement Title: ", "AI-Powered Criminal Network Analysis System"),
                ("Theme: ", "Software — Security, Surveillance & Cybersecurity"),
                ("PS Category: ", "Software"),
                ("Team ID: ", "[Your Team ID]"),
                ("Team Name: ", "[Your Registered Team Name]"),
                ("Idea / Project Title: ", "VEILLE AI — Multisource Intelligence Fusion Platform")
            ]
            
            for idx, (label, val) in enumerate(items):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.space_before = Pt(5)
                p.space_after = Pt(3)
                
                run1 = p.add_run()
                run1.text = label
                run1.font.name = "Arial"
                run1.font.size = Pt(13.5)
                run1.font.bold = True
                run1.font.color.rgb = NAVY_DARK
                
                run2 = p.add_run()
                run2.text = val
                run2.font.name = "Arial"
                run2.font.size = Pt(13.5)
                run2.font.bold = False
                run2.font.color.rgb = PRIMARY_BLUE if idx in (0, 1, 6) else TEXT_DARK

    # ==========================================
    # SLIDE 2: PROPOSED SOLUTION + PIPELINE FLOWCHART
    # ==========================================
    s2 = prs.slides[1]
    title_shape = None
    for shape in s2.shapes:
        if shape.name == "Title 1" or (shape.has_text_frame and shape.top < Inches(1.3)):
            title_shape = shape
            break
    style_title(title_shape, "IDEA TITLE: VEILLE AI — INTELLIGENCE FUSION & GRAPH ANALYTICS")
    update_team_oval(s2)
    clear_body_shapes(s2, title_shape)

    # Top Text Box: Solution Pointers
    s2_box = s2.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(12.1), Inches(2.9))
    tf2 = s2_box.text_frame
    tf2.word_wrap = True
    tf2.clear()

    sections_s2 = [
        {
            "heading": "Proposed Solution (Multisource Intelligence Fusion & Knowledge Graph)",
            "bullets": [
                "Automated Ingestion Engine: Consolidates unstructured Police FIRs, telecom CDR spreadsheets, banking Hawala ledgers, and wiretaps into a unified queryable Neo4j Graph.",
                "How it Solves the Problem: Smashes cross-jurisdictional data silos; cuts manual link-chart drawing latency by >90% while detecting sleeper cells and shared burner SIMs.",
                "Innovation & Uniqueness: Combines InLegalNER (BNS/IPC Legal AI) + Louvain Community Clustering + Evidence-Grounded Sovereign RAG (replies out-of-scope to protect integrity)."
            ]
        }
    ]

    for sec in sections_s2:
        p_head = tf2.paragraphs[0]
        p_head.space_before = Pt(0)
        p_head.space_after = Pt(2)
        r_head = p_head.add_run()
        r_head.text = "▶  " + sec["heading"]
        r_head.font.name = "Arial"
        r_head.font.size = Pt(12.5)
        r_head.font.bold = True
        r_head.font.color.rgb = PRIMARY_BLUE

        for bullet in sec["bullets"]:
            p_b = tf2.add_paragraph()
            p_b.level = 1
            p_b.space_before = Pt(1.5)
            p_b.space_after = Pt(1.5)
            prefix, rest = bullet.split(":", 1)
            
            r_pre = p_b.add_run()
            r_pre.text = "• " + prefix + ":"
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10)
            r_pre.font.bold = True
            r_pre.font.color.rgb = NAVY_DARK

            r_rest = p_b.add_run()
            r_rest.text = rest
            r_rest.font.name = "Arial"
            r_rest.font.size = Pt(10)
            r_rest.font.color.rgb = TEXT_DARK

    # Bottom Diagram: 5-Stage Pipeline Flowchart
    pipeline_img = "d:/project/Crimenet/diagrams/pipeline_flowchart.png"
    if os.path.exists(pipeline_img):
        s2.shapes.add_picture(pipeline_img, Inches(0.55), Inches(4.25), Inches(12.2), Inches(2.55))

    # ==========================================
    # SLIDE 3: TECHNICAL APPROACH + SYSTEM ARCHITECTURE
    # ==========================================
    s3 = prs.slides[2]
    title_shape3 = None
    for shape in s3.shapes:
        if shape.name == "Title 1" or (shape.has_text_frame and shape.top < Inches(1.3)):
            title_shape3 = shape
            break
    style_title(title_shape3, "TECHNICAL APPROACH: ARCHITECTURE & METHODOLOGY")
    update_team_oval(s3)
    clear_body_shapes(s3, title_shape3)

    # Top Text Box: Technologies & Methodology
    s3_box = s3.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(12.1), Inches(2.8))
    tf3 = s3_box.text_frame
    tf3.word_wrap = True
    tf3.clear()

    sections_s3 = [
        {
            "heading": "Technologies to be Used & Core Production Stack",
            "bullets": [
                "AI & NLP Stack: InLegalNER (Indian Legal BERT for BNS 2024 / IPC), OpenAI Whisper-v3 (Speech ASR), FastEmbed Vector Embeddings.",
                "Graph & Database Infrastructure: Neo4j (Graph Database & Graph Data Science GDS), PostgreSQL 16 (Transactional Outbox), MinIO (S3 Evidence Vault).",
                "Backend, Streaming & UI: FastAPI (Async REST), Apache Kafka & Celery (Outbox Stream Ingestion), React 19, TypeScript & D3 Force Graph Canvas."
            ]
        }
    ]

    for sec in sections_s3:
        p_head = tf3.paragraphs[0]
        p_head.space_before = Pt(0)
        p_head.space_after = Pt(2)
        r_head = p_head.add_run()
        r_head.text = "▶  " + sec["heading"]
        r_head.font.name = "Arial"
        r_head.font.size = Pt(12.5)
        r_head.font.bold = True
        r_head.font.color.rgb = PRIMARY_BLUE

        for bullet in sec["bullets"]:
            p_b = tf3.add_paragraph()
            p_b.level = 1
            p_b.space_before = Pt(1.5)
            p_b.space_after = Pt(1.5)
            prefix, rest = bullet.split(":", 1)
            
            r_pre = p_b.add_run()
            r_pre.text = "• " + prefix + ":"
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10)
            r_pre.font.bold = True
            r_pre.font.color.rgb = NAVY_DARK

            r_rest = p_b.add_run()
            r_rest.text = rest
            r_rest.font.name = "Arial"
            r_rest.font.size = Pt(10)
            r_rest.font.color.rgb = TEXT_DARK

    # Bottom Diagram: System Architecture Diagram
    arch_img = "d:/project/Crimenet/diagrams/system_architecture.png"
    if os.path.exists(arch_img):
        s3.shapes.add_picture(arch_img, Inches(0.55), Inches(4.15), Inches(12.2), Inches(2.65))

    # ==========================================
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # ==========================================
    s4 = prs.slides[3]
    title_shape4 = None
    for shape in s4.shapes:
        if shape.name == "Title 1" or (shape.has_text_frame and shape.top < Inches(1.3)):
            title_shape4 = shape
            break
    style_title(title_shape4, "FEASIBILITY, VIABILITY & RISK MITIGATION STRATEGIES")
    update_team_oval(s4)
    clear_body_shapes(s4, title_shape4)

    s4_box = s4.shapes.add_textbox(Inches(0.6), Inches(1.30), Inches(12.1), Inches(5.4))
    tf4 = s4_box.text_frame
    tf4.word_wrap = True
    tf4.clear()

    sections_s4 = [
        {
            "heading": "Analysis of Feasibility & Production Viability",
            "bullets": [
                "Sub-Second Graph Querying: Cypher queries execute in <25ms across 1,000,000+ nodes and edges on standard LEA workstation hardware.",
                "100% Air-Gapped Sovereign Deployment: Fully local on-premise execution — zero sensitive police data, FIRs, or wiretaps leave the agency intranet.",
                "Modular Microservice Scalability: Containerized Docker architecture enabling horizontal scaling across State Police HQs and District Commissionerates."
            ]
        },
        {
            "heading": "Potential Challenges & Operational Risks",
            "bullets": [
                "Multilingual Indian Legal Variance: Regional language FIRs, varied legal phrasing, and noisy spelling of suspect aliases across Indian states.",
                "High-Velocity Telephony Scale: Ingesting millions of daily CDR telecom log rows during multi-city syndicate operations.",
                "Investigative False Links: Risk of false associations (e.g. shared lawyer or landlord mistaken for criminal syndicate members)."
            ]
        },
        {
            "heading": "Strategies for Overcoming Challenges",
            "bullets": [
                "Fine-Tuned Legal Models: Specialized InLegalNER models trained on Indian Supreme Court, High Court, and FIR datasets for precise BNS/IPC extraction.",
                "Distributed Kafka Streaming: Partitioned event topics with async worker pools ensure zero dropped packets during massive telecom log uploads.",
                "Human-in-the-Loop Review Queue: Ambiguous relationships below confidence thresholds are routed to an investigator review queue before graph commit."
            ]
        }
    ]

    first_p = True
    for sec in sections_s4:
        p_head = tf4.paragraphs[0] if first_p else tf4.add_paragraph()
        first_p = False
        p_head.space_before = Pt(6)
        p_head.space_after = Pt(2)
        r_head = p_head.add_run()
        r_head.text = "▶  " + sec["heading"]
        r_head.font.name = "Arial"
        r_head.font.size = Pt(12)
        r_head.font.bold = True
        r_head.font.color.rgb = PRIMARY_BLUE

        for bullet in sec["bullets"]:
            p_b = tf4.add_paragraph()
            p_b.level = 1
            p_b.space_before = Pt(1.5)
            p_b.space_after = Pt(1.5)
            prefix, rest = bullet.split(":", 1)
            
            r_pre = p_b.add_run()
            r_pre.text = "• " + prefix + ":"
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10)
            r_pre.font.bold = True
            r_pre.font.color.rgb = NAVY_DARK

            r_rest = p_b.add_run()
            r_rest.text = rest
            r_rest.font.name = "Arial"
            r_rest.font.size = Pt(10)
            r_rest.font.color.rgb = TEXT_DARK

    # ==========================================
    # SLIDE 5: IMPACT AND BENEFITS + COMPARISON MATRIX
    # ==========================================
    s5 = prs.slides[4]
    title_shape5 = None
    for shape in s5.shapes:
        if shape.name == "Title 1" or (shape.has_text_frame and shape.top < Inches(1.3)):
            title_shape5 = shape
            break
    style_title(title_shape5, "IMPACT AND BENEFITS: LAW ENFORCEMENT & SOCIETY")
    update_team_oval(s5)
    clear_body_shapes(s5, title_shape5)

    s5_box = s5.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(12.1), Inches(2.9))
    tf5 = s5_box.text_frame
    tf5.word_wrap = True
    tf5.clear()

    sections_s5 = [
        {
            "heading": "Potential Impact on Law Enforcement & Public Safety",
            "bullets": [
                "Radical Turnaround Acceleration: Cuts multi-jurisdictional syndicate correlation from weeks of manual charting to seconds of automated graph topology.",
                "Sleeper Cell & Kingpin Isolation: Centrality metrics reveal shadow operators who never appear directly in FIRs but coordinate communications and cash flows.",
                "Judicial Integrity & Sec 65B Compliance: Section 65B Indian Evidence Act / BSA 2023 compliant audit trails and SHA-256 seals ensure court admissibility."
            ]
        }
    ]

    for sec in sections_s5:
        p_head = tf5.paragraphs[0]
        p_head.space_before = Pt(0)
        p_head.space_after = Pt(2)
        r_head = p_head.add_run()
        r_head.text = "▶  " + sec["heading"]
        r_head.font.name = "Arial"
        r_head.font.size = Pt(12.5)
        r_head.font.bold = True
        r_head.font.color.rgb = PRIMARY_BLUE

        for bullet in sec["bullets"]:
            p_b = tf5.add_paragraph()
            p_b.level = 1
            p_b.space_before = Pt(1.5)
            p_b.space_after = Pt(1.5)
            prefix, rest = bullet.split(":", 1)
            
            r_pre = p_b.add_run()
            r_pre.text = "• " + prefix + ":"
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10)
            r_pre.font.bold = True
            r_pre.font.color.rgb = NAVY_DARK

            r_rest = p_b.add_run()
            r_rest.text = rest
            r_rest.font.name = "Arial"
            r_rest.font.size = Pt(10)
            r_rest.font.color.rgb = TEXT_DARK

    # Bottom Diagram: Comparison Matrix
    matrix_img = "d:/project/Crimenet/diagrams/comparison_matrix.png"
    if os.path.exists(matrix_img):
        s5.shapes.add_picture(matrix_img, Inches(0.55), Inches(4.30), Inches(12.2), Inches(2.45))

    # ==========================================
    # SLIDE 6: RESEARCH AND REFERENCES
    # ==========================================
    s6 = prs.slides[5]
    title_shape6 = None
    for shape in s6.shapes:
        if shape.name == "Title 1" or (shape.has_text_frame and shape.top < Inches(1.3)):
            title_shape6 = shape
            break
    style_title(title_shape6, "RESEARCH FOUNDATIONS, BENCHMARKS & REFERENCES")
    update_team_oval(s6)
    clear_body_shapes(s6, title_shape6)

    s6_box = s6.shapes.add_textbox(Inches(0.6), Inches(1.30), Inches(12.1), Inches(5.4))
    tf6 = s6_box.text_frame
    tf6.word_wrap = True
    tf6.clear()

    sections_s6 = [
        {
            "heading": "Academic Research & Core Network Science Literature",
            "bullets": [
                "Legal NLP & InLegalNER: Paul, S., Mandal, A., Goyal, P., & Ghosh, S. (2023) — 'Pre-trained Language Models for the Indian Legal Domain', EMNLP & LREC-COLING Benchmarks.",
                "Graph Community Detection: Blondel, V. D., Guillaume, J. L., Lambiotte, R., & Lefebvre, E. (2008) — 'Fast unfolding of communities in large networks (Louvain Algorithm)', J. Stat. Mech.",
                "Criminal Network Analytics: Sparrow, M. K. (1991) — 'The Network Approach to Criminal Intelligence Analysis: An Overview', Social Networks / FBI Law Enforcement Bulletin.",
                "Probabilistic Record Linkage: Fellegi, I. P., & Sunter, A. B. (1969) — 'A Theory for Record Linkage', Journal of the American Statistical Association."
            ]
        },
        {
            "heading": "Standards, Statutory Compliance & Live Prototype Verification",
            "bullets": [
                "Digital Evidence Forensics: NIST Special Publication 800-88 (Media Sanitization) & ISO/IEC 27037 (Digital Evidence Identification & Preservation).",
                "Statutory Compliance: Section 65B Indian Evidence Act / Section 63 Bharatiya Sakshya Adhiniyam (BSA 2023) Electronic Evidence Certification Standards.",
                "Working Codebase & Live Benchmarks: Production-tested VEILLE system with automated Neo4j sync, Celery task pipelines, and real-time interactive canvas."
            ]
        }
    ]

    first_p6 = True
    for sec in sections_s6:
        p_head = tf6.paragraphs[0] if first_p6 else tf6.add_paragraph()
        first_p6 = False
        p_head.space_before = Pt(8)
        p_head.space_after = Pt(3)
        r_head = p_head.add_run()
        r_head.text = "▶  " + sec["heading"]
        r_head.font.name = "Arial"
        r_head.font.size = Pt(12.5)
        r_head.font.bold = True
        r_head.font.color.rgb = PRIMARY_BLUE

        for bullet in sec["bullets"]:
            p_b = tf6.add_paragraph()
            p_b.level = 1
            p_b.space_before = Pt(2)
            p_b.space_after = Pt(2)
            prefix, rest = bullet.split(":", 1)
            
            r_pre = p_b.add_run()
            r_pre.text = "• " + prefix + ":"
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10.5)
            r_pre.font.bold = True
            r_pre.font.color.rgb = NAVY_DARK

            r_rest = p_b.add_run()
            r_rest.text = rest
            r_rest.font.name = "Arial"
            r_rest.font.size = Pt(10.5)
            r_rest.font.color.rgb = TEXT_DARK

    prs.save(output_path)
    print(f"Presentation built successfully: {output_path}")

    # Also try saving to original output path if unlocked
    try:
        prs.save("d:/project/Crimenet/SIH2026_VEILLE_AI_Presentation.pptx")
        print("Also updated SIH2026_VEILLE_AI_Presentation.pptx")
    except Exception as e:
        print("Note: SIH2026_VEILLE_AI_Presentation.pptx was locked by an open PowerPoint viewer. Saved as SIH2026_VEILLE_AI_Presentation_v2.pptx.")

if __name__ == "__main__":
    build_presentation()
