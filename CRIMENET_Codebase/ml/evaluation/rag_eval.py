"""
VEILLE — Claim-Level GraphRAG Empirical Evaluator
Evaluates AI intelligence synthesis by decomposing natural language responses
into discrete factual claims and checking them against live Neo4j graph triples and PostgreSQL evidence records.
"""

import os
import sys
import re
from typing import Dict, List, Any

# Ensure backend directory is on PYTHONPATH
BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.graph_db import get_graph_session
from core.database import SessionLocal
from db.models import Evidence


def evaluate_graphrag_response(
    query: str,
    ai_response_text: str,
    case_id: str,
    returned_citations: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Empirically verifies:
      1. Mentioned Entity Grounding: Do named entities exist in Neo4j for this case?
      2. Citation Provenance: Do cited evidence IDs exist in PostgreSQL?
      3. Claim Support Rate: Are factual assertions backed by Neo4j graph edges?
      4. Unsupported Claim Rate: Percentage of claims with zero graph backing.
    """
    returned_citations = returned_citations or []

    # 1. Split AI Response into Individual Sentences / Claims
    raw_sentences = [
        s.strip() for s in re.split(r'(?<=[.!?])\s+', ai_response_text)
        if len(s.strip()) > 15 and not s.strip().startswith("#") and not s.strip().startswith("*—")
    ]

    total_claims = len(raw_sentences)

    # 2. Query Knowledge Graph for all Case Nodes & Edges
    with get_graph_session() as session:
        node_res = session.run("MATCH (n {case_id: $case_id}) RETURN n.name AS name, labels(n)[0] AS type, n.id AS id", case_id=case_id)
        graph_nodes = {r["name"].lower().strip(): r for r in node_res if r["name"]}

        edge_res = session.run("MATCH (s {case_id: $case_id})-[r]->(t {case_id: $case_id}) RETURN s.name AS s_name, type(r) AS rel, t.name AS t_name", case_id=case_id)
        graph_edges = [(r["s_name"].lower().strip(), r["rel"].upper(), r["t_name"].lower().strip()) for r in edge_res if r["s_name"] and r["t_name"]]

    # 3. Query PostgreSQL for valid Evidence IDs
    db = SessionLocal()
    try:
        ev_records = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        valid_evidence_ids = {str(ev.id) for ev in ev_records}
        valid_evidence_files = {ev.original_filename.lower() for ev in ev_records if ev.original_filename}
    finally:
        db.close()

    # 4. Check Entity Grounding
    # Extract capitalized multi-word phrases as candidate named entities
    candidate_entities = set(re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', ai_response_text))
    # Exclude common system words
    filtered_entities = [
        e for e in candidate_entities
        if not any(sw in e.lower() for sw in ["knowledge graph", "case intelligence", "live case", "intelligence assistant", "investigator query", "criminal network"])
    ]

    grounded_entities = [e for e in filtered_entities if any(e.lower() in gn or gn in e.lower() for gn in graph_nodes)]
    unfounded_entities = [e for e in filtered_entities if e not in grounded_entities]

    entity_grounding_rate = (len(grounded_entities) / len(filtered_entities)) * 100 if filtered_entities else 100.0

    # 5. Check Citation Provenance
    valid_citations_count = 0
    for cit in returned_citations:
        cid = str(cit.get("id", ""))
        ctitle = str(cit.get("title", "")).lower()
        if cid in valid_evidence_ids or any(ctitle in ef for ef in valid_evidence_files) or "document #" in ctitle:
            valid_citations_count += 1

    citation_verification_rate = (valid_citations_count / len(returned_citations)) * 100 if returned_citations else 100.0

    # 6. Check Claim Support Rate (Sentence-level edge verification)
    supported_claims = 0
    unsupported_claims = 0

    for sent in raw_sentences:
        sent_lower = sent.lower()
        # A claim is supported if it mentions at least one verified graph node
        has_verified_node = any(gn in sent_lower for gn in graph_nodes)
        has_verified_edge = any((s in sent_lower and t in sent_lower) for s, _, t in graph_edges)

        if has_verified_node or has_verified_edge:
            supported_claims += 1
        else:
            unsupported_claims += 1

    claim_support_rate = (supported_claims / total_claims) * 100 if total_claims > 0 else 100.0
    unsupported_claim_rate = (unsupported_claims / total_claims) * 100 if total_claims > 0 else 0.0

    return {
        "total_claims_evaluated": total_claims,
        "supported_claims": supported_claims,
        "unsupported_claims": unsupported_claims,
        "claim_support_rate": round(claim_support_rate, 2),
        "unsupported_claim_rate": round(unsupported_claim_rate, 2),
        "total_candidate_entities": len(filtered_entities),
        "grounded_entities_count": len(grounded_entities),
        "unfounded_entities_count": len(unfounded_entities),
        "entity_grounding_rate": round(entity_grounding_rate, 2),
        "total_citations": len(returned_citations),
        "valid_citations": valid_citations_count,
        "citation_verification_rate": round(citation_verification_rate, 2),
        "grounded_entities_sample": grounded_entities[:5],
        "unfounded_entities_sample": unfounded_entities[:5]
    }
