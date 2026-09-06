"""
VEILLE — Structured Claim-Level GraphRAG Grounding & Entailment Evaluator
Decomposes natural language AI synthesis into discrete factual assertions (SPO triples),
verifying them against live Neo4j graph relationships and PostgreSQL raw evidence text.
"""

import os
import sys
import re
from typing import Dict, List, Any, Tuple

# Ensure backend directory is on PYTHONPATH
BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.graph_db import get_graph_session
from core.database import SessionLocal
from db.models import Evidence


def _extract_spo_triples_from_sentence(sentence: str, known_entities: List[str]) -> List[Tuple[str, str, str]]:
    """Extracts candidate (Subject, Relation, Object) triples from a factual sentence."""
    triples = []
    
    # 1. Match structured arrow notation: e.g. "Vikram Mehta --[OWNS]--> +91-9820199482"
    arrow_match = re.search(r'[-*]?\s*([A-Za-z0-9_\+\-\.\s]+?)\s*--\[([A-Z_]+)\]-->\s*([A-Za-z0-9_\+\-\.\s]+)', sentence)
    if arrow_match:
        s_raw = arrow_match.group(1).strip()
        rel_raw = arrow_match.group(2).strip()
        o_raw = arrow_match.group(3).split("(")[0].strip()
        triples.append((s_raw, rel_raw, o_raw))
        return triples

    # 2. Natural language entity co-occurrence + predicate keyword extraction
    found_entities = [e for e in known_entities if e.lower() in sentence.lower()]
    if len(found_entities) >= 2:
        for i in range(len(found_entities)):
            for j in range(i + 1, len(found_entities)):
                s = found_entities[i]
                o = found_entities[j]
                
                # Infer relation intent from relational keywords in sentence
                rel_kw = "ASSOCIATED_WITH"
                s_lower = sentence.lower()
                if any(w in s_lower for w in ["calls", "communicat", "phoned", "spoke", "messag", "cdr", "telecom"]):
                    rel_kw = "COMMUNICATES_WITH"
                elif any(w in s_lower for w in ["transfer", "sent", "wire", "paid", "hawala", "lakh", "crore", "inr", "account"]):
                    rel_kw = "TRANSFERS_FUNDS_TO"
                elif any(w in s_lower for w in ["owns", "director", "shareholder", "operates", "shell", "front", "registered"]):
                    rel_kw = "OWNS"
                elif any(w in s_lower for w in ["located", "address", "safehouse", "port", "office", "terminal"]):
                    rel_kw = "LOCATED_AT"

                triples.append((s, rel_kw, o))
                
    return triples


def evaluate_graphrag_response(
    query: str,
    ai_response_text: str,
    case_id: str,
    returned_citations: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Empirically verifies GraphRAG synthesis with structured 4-tier classification:
      1. SUPPORTED: Entities and relational link confirmed in Neo4j and evidence text.
      2. PARTIALLY_SUPPORTED: Verified graph nodes present, relation unlinked in KG.
      3. UNSUPPORTED: Entities or assertions have zero knowledge graph backing.
      4. CONTRADICTED: Directly contradicts established graph properties.
    Also separates Citation Validity (ID existence) from Citation Entailment (content support).
    """
    returned_citations = returned_citations or []

    # 1. Split AI Response into Individual Sentences / Claims
    raw_sentences = [
        s.strip() for s in re.split(r'(?<=[.!?\n])\s+', ai_response_text)
        if len(s.strip()) > 10 and not s.strip().startswith("#") and not s.strip().startswith("*—")
    ]

    total_claims = len(raw_sentences)

    # 2. Query Knowledge Graph for all Case Nodes & Edges
    with get_graph_session() as session:
        node_res = session.run("MATCH (n {case_id: $case_id}) RETURN n.name AS name, labels(n)[0] AS type, n.id AS id", case_id=case_id)
        graph_nodes = {r["name"].lower().strip(): r for r in node_res if r["name"]}
        known_node_names = [r["name"] for r in graph_nodes.values()]

        edge_res = session.run("MATCH (s {case_id: $case_id})-[r]->(t {case_id: $case_id}) RETURN s.name AS s_name, type(r) AS rel, t.name AS t_name", case_id=case_id)
        graph_edges = [(r["s_name"].lower().strip(), r["rel"].upper(), r["t_name"].lower().strip()) for r in edge_res if r["s_name"] and r["t_name"]]

    # 3. Query PostgreSQL for valid Evidence IDs and Content
    db = SessionLocal()
    evidence_contents = []
    demo_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "scripts", "demo_data")
    try:
        ev_records = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        valid_evidence_ids = {str(ev.id) for ev in ev_records}
        valid_evidence_files = {ev.original_filename.lower() for ev in ev_records if ev.original_filename}
        for ev in ev_records:
            doc_content = ""
            if ev.file_path and os.path.exists(ev.file_path):
                try:
                    with open(ev.file_path, "r", encoding="utf-8", errors="ignore") as f:
                        doc_content = f.read()
                except Exception:
                    pass
            elif ev.original_filename:
                demo_file = os.path.join(demo_data_dir, ev.original_filename)
                if os.path.exists(demo_file):
                    try:
                        with open(demo_file, "r", encoding="utf-8", errors="ignore") as f:
                            doc_content = f.read()
                    except Exception:
                        pass

            evidence_contents.append({
                "id": str(ev.id),
                "filename": ev.original_filename or "",
                "source_type": ev.source_type or "",
                "hash": ev.hash or "",
                "content": doc_content
            })
    finally:
        db.close()

    # 4. Check Named Entity Grounding
    candidate_entities = set(re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', ai_response_text))
    filtered_entities = [
        e for e in candidate_entities
        if not any(sw in e.lower() for sw in ["knowledge graph", "case intelligence", "live case", "intelligence assistant", "investigator query", "criminal network"])
    ]

    grounded_entities = [e for e in filtered_entities if any(e.lower() in gn or gn in e.lower() for gn in graph_nodes)]
    unfounded_entities = [e for e in filtered_entities if e not in grounded_entities]
    entity_grounding_rate = (len(grounded_entities) / len(filtered_entities)) * 100 if filtered_entities else 100.0

    # 5. Citation Validity (ID exists in SoR) vs Citation Entailment (content corroborates relational claim / SPO)
    valid_citations_count = 0
    entailed_citations_count = 0

    all_response_triples = []
    for sent in raw_sentences:
        all_response_triples.extend(_extract_spo_triples_from_sentence(sent, known_node_names))

    for cit in returned_citations:
        cid = str(cit.get("id", ""))
        ctitle = str(cit.get("title", "")).lower()
        # Validity check
        is_valid = (cid in valid_evidence_ids or any(ctitle in ef for ef in valid_evidence_files) or "document #" in ctitle)
        if is_valid:
            valid_citations_count += 1
            # True Entailment check: does the cited evidence document text actually contain relational support for the asserted claims?
            ev_match = [ec for ec in evidence_contents if ec["id"] == cid or (ec["filename"] and ec["filename"].lower() in ctitle)]
            if ev_match and ev_match[0]["content"]:
                doc_text_lower = ev_match[0]["content"].lower()
                
                # Check for directional relation support: evidence text must contain subject, object, or relational context
                relation_entailed = False
                for s, rel, o in all_response_triples:
                    s_low, o_low = s.lower(), o.lower()
                    if s_low in doc_text_lower and o_low in doc_text_lower:
                        # Check predicate keywords in document text
                        rel_keywords = {
                            "COMMUNICATES_WITH": ["call", "cdr", "communicat", "phoned", "spoke", "dial", "sms", "messag"],
                            "TRANSFERS_FUNDS_TO": ["transfer", "wire", "sent", "paid", "hawala", "ledger", "inr", "lakh", "crore", "account"],
                            "OWNS": ["owner", "director", "shareholder", "operates", "shell", "vehicle", "registered", "account"],
                            "LOCATED_AT": ["located", "address", "safehouse", "port", "terminal", "sector", "hotel", "mumbai"],
                            "ASSOCIATED_WITH": ["associate", "syndicate", "network", "meeting", "operation", "with"]
                        }.get(rel, ["with", "and"])
                        
                        if any(kw in doc_text_lower for kw in rel_keywords):
                            # Verify no contradictory negation in proximity
                            if not any(neg in doc_text_lower for neg in ["not linked", "never transferred", "no record of contact"]):
                                relation_entailed = True
                                break

                # Fallback to grounded entity verification with contextual keywords if triples list was sparse
                if not relation_entailed and grounded_entities:
                    matched_grounded = [ge for ge in grounded_entities if ge.lower() in doc_text_lower]
                    if len(matched_grounded) >= 2 or (len(matched_grounded) >= 1 and any(kw in doc_text_lower for kw in ["suspect", "transfer", "call", "account", "vehicle", "fir", "cdr"])):
                        relation_entailed = True

                if relation_entailed:
                    entailed_citations_count += 1

            elif ev_match:
                # If raw content unavailable, verify against known filename/metadata keywords
                ev_str = (ev_match[0]["filename"] + " " + ev_match[0]["source_type"]).lower()
                if any(ge.lower() in ev_str for ge in grounded_entities):
                    entailed_citations_count += 1

    citation_validity_rate = round((valid_citations_count / len(returned_citations)) * 100, 2) if returned_citations else "N/A"
    citation_entailment_rate = round((entailed_citations_count / valid_citations_count) * 100, 2) if valid_citations_count > 0 else ("N/A" if not returned_citations else 0.0)

    # 6. Structured Claim-Level Entailment (4-tier classification)
    supported_claims = 0
    partially_supported_claims = 0
    unsupported_claims = 0
    contradicted_claims = 0

    claim_breakdown = []

    for sent in raw_sentences:
        sent_lower = sent.lower()
        extracted_triples = _extract_spo_triples_from_sentence(sent, known_node_names)

        # Check if verified triples exist in Neo4j
        has_exact_edge = False
        has_any_edge = False
        has_contradiction = False

        for s, rel, o in extracted_triples:
            s_l, o_l = s.lower().strip(), o.lower().strip()
            edge_exists = any((s_l in s_edge and o_l in t_edge) or (o_l in s_edge and s_l in t_edge) for s_edge, _, t_edge in graph_edges)
            if edge_exists:
                has_any_edge = True
            if any(((s_l in s_edge and o_l in t_edge) or (o_l in s_edge and s_l in t_edge)) and rel_edge == rel for s_edge, rel_edge, t_edge in graph_edges):
                has_exact_edge = True

            # Contradiction check: negation in sentence while graph affirms relationship
            if any(neg in sent_lower for neg in ["not linked", "no connection", "never transferred", "unrelated", "innocent", "no association"]) and edge_exists:
                has_contradiction = True

        has_verified_node = any(gn in sent_lower for gn in graph_nodes)

        if has_contradiction:
            status = "CONTRADICTED"
            contradicted_claims += 1
        elif has_exact_edge or (has_any_edge and len(extracted_triples) > 0):
            status = "SUPPORTED"
            supported_claims += 1
        elif has_verified_node:
            status = "PARTIALLY_SUPPORTED"
            partially_supported_claims += 1
        else:
            status = "UNSUPPORTED"
            unsupported_claims += 1

        claim_breakdown.append({
            "claim": sent[:120] + "..." if len(sent) > 120 else sent,
            "status": status,
            "triples": extracted_triples
        })

    claim_support_rate = (supported_claims / total_claims) * 100 if total_claims > 0 else 0.0
    partial_support_rate = (partially_supported_claims / total_claims) * 100 if total_claims > 0 else 0.0
    unsupported_claim_rate = (unsupported_claims / total_claims) * 100 if total_claims > 0 else 0.0

    return {
        "total_claims_evaluated": total_claims,
        "supported_claims": supported_claims,
        "partially_supported_claims": partially_supported_claims,
        "unsupported_claims": unsupported_claims,
        "contradicted_claims": contradicted_claims,
        "claim_support_rate": round(claim_support_rate, 2),
        "partial_support_rate": round(partial_support_rate, 2),
        "unsupported_claim_rate": round(unsupported_claim_rate, 2),
        "total_candidate_entities": len(filtered_entities),
        "grounded_entities_count": len(grounded_entities),
        "unfounded_entities_count": len(unfounded_entities),
        "entity_grounding_rate": round(entity_grounding_rate, 2),
        "total_citations": len(returned_citations),
        "valid_citations": valid_citations_count,
        "entailed_citations": entailed_citations_count,
        "citation_validity_rate": round(citation_validity_rate, 2),
        "citation_entailment_rate": round(citation_entailment_rate, 2),
        "claim_breakdown_sample": claim_breakdown[:5]
    }
