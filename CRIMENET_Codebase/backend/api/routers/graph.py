"""
VEILLE v4.0 — Graph Router
Real Neo4j Cypher queries replace all hardcoded/mocked graph responses.
All queries are scoped to a specific case_id to enforce data isolation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.auth import get_current_user, log_action, require_role
from core.database import get_db
from core.graph_db import get_graph_session
from core.redis_client import cache_get, cache_set
from db.models import Case

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


import uuid

def _verify_case_access(case_id: str, current_user: dict, db: Session) -> Case:
    """
    Shared helper: verify the case exists and the current user can access it.
    Raises 404 if not found, 403 if access denied.
    """
    try:
        val_uuid = uuid.UUID(case_id)
        case = db.query(Case).filter(Case.id == val_uuid).first()
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=404, detail=f"Invalid case ID format: '{case_id}'. Must be a valid UUID.")

    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    if (
        current_user.get("role") == "INVESTIGATOR"
        and not any(str(inv.id) == current_user.get("id") for inv in getattr(case, "investigators", []))
        and current_user.get("role") != "HEAD"
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this case's graph.",
        )
    return case


@router.get("/{case_id}")
@router.get("/dossier/{case_id}")
def get_graph(

    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch all nodes and edges for a specific case from Neo4j.
    Returns data in the format expected by the React Force Graph frontend.
    All queries are scoped to case_id to enforce data isolation.
    """
    case = _verify_case_access(case_id, current_user, db)
    case_id_str = str(case.id)
    log_action(db, current_user["id"], "QUERY_GRAPH", case_id=case_id_str)

    cache_key = f"graph_data:{case_id_str}"
    cached_data = cache_get(cache_key)
    if cached_data:
        return cached_data

    try:
        with get_graph_session() as session:
                # ── Fetch Nodes ──────────────────────────────────────────────────
            nodes_result = session.run(
                """
                MATCH (n)
                WHERE n.case_id = $case_id OR $case_id = 'all'
                RETURN
                    n.id        AS id,
                    labels(n)[0] AS label,
                    n.name      AS name,
                    properties(n) AS props
                """,
                case_id=case_id_str,
            )

            nodes = []
            for record in nodes_result:
                props = dict(record["props"])
                props.pop("case_id", None)
                
                # If inner properties is stored as JSON string, unpack it
                if "properties" in props and isinstance(props["properties"], str):
                    try:
                        import json
                        inner = json.loads(props["properties"])
                        if isinstance(inner, dict):
                            for k, v in inner.items():
                                if k not in props:
                                    props[k] = v
                    except Exception:
                        pass

                node_label = record["name"] or record["id"]
                node_type = (record["label"] or "unknown").lower()
                nodes.append({
                    "id": record["id"],
                    "name": node_label,
                    "label": node_label,
                    "type": node_type,
                    "properties": props,
                    "data": {
                        "label": node_label,
                        "type": node_type,
                        "properties": props,
                    },
                })

            # ── Fetch Edges ──────────────────────────────────────────────────
            edges_result = session.run(
                """
                MATCH (n)-[r]->(m)
                WHERE (n.case_id = $case_id AND m.case_id = $case_id) OR $case_id = 'all'
                RETURN
                    n.id           AS source,
                    m.id           AS target,
                    type(r)        AS type,
                    r.confidence   AS confidence,
                    r.source_evidence_id AS evidence_id,
                    properties(r)  AS props
                """,
                case_id=case_id_str,
            )

            edges = []
            for i, record in enumerate(edges_result):
                edge_props = dict(record["props"]) if record.get("props") else {}
                edge_props.pop("case_id", None)
                edges.append({
                    "id": f"e{i}",
                    "source": record["source"],
                    "target": record["target"],
                    "label": record["type"],
                    "confidence": record["confidence"],
                    "properties": edge_props,
                    "data": {
                        "confidence": record["confidence"],
                        "evidence_id": record["evidence_id"],
                        "properties": edge_props,
                    },
                })

            response_data = {
                "case_id": case_id,
                "nodes": nodes,
                "edges": edges,
                "stats": {
                    "node_count": len(nodes),
                    "edge_count": len(edges),
                },
            }
            cache_set(cache_key, response_data, expire_seconds=60)
            return response_data

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Neo4j graph query failed for case {case_id}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Graph database temporarily unavailable. Please try again.",
        )


@router.get("/{case_id}/analytics")
def get_graph_analytics(
    case_id: str,
    algorithm: str = "degree",  # degree | pagerank | louvain
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return graph analytics (Degree, PageRank, or Louvain) for a case.
    PageRank and Louvain require the Neo4j GDS plugin.
    """
    _verify_case_access(case_id, current_user, db)
    log_action(db, current_user["id"], f"ANALYTICS_{algorithm.upper()}", case_id=case_id)

    cache_key = f"graph_analytics:{case_id}:{algorithm}"
    cached_data = cache_get(cache_key)
    if cached_data:
        return cached_data

    try:
        with get_graph_session() as session:
            if algorithm == "pagerank":
                # Requires GDS
                query = """
                CALL gds.pageRank.stream({
                  nodeQuery: 'MATCH (n) WHERE n.case_id = $case_id RETURN id(n) AS id',
                  relationshipQuery: 'MATCH (n)-[r]->(m) WHERE n.case_id = $case_id AND m.case_id = $case_id RETURN id(n) AS source, id(m) AS target',
                  parameters: { case_id: $case_id }
                })
                YIELD nodeId, score
                WITH gds.util.asNode(nodeId) AS n, score
                RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, score AS score
                ORDER BY score DESC LIMIT 50
                """
            elif algorithm == "louvain":
                # Requires GDS
                query = """
                CALL gds.louvain.stream({
                  nodeQuery: 'MATCH (n) WHERE n.case_id = $case_id RETURN id(n) AS id',
                  relationshipQuery: 'MATCH (n)-[r]-(m) WHERE n.case_id = $case_id AND m.case_id = $case_id RETURN id(n) AS source, id(m) AS target',
                  parameters: { case_id: $case_id }
                })
                YIELD nodeId, communityId
                WITH gds.util.asNode(nodeId) AS n, communityId
                RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, communityId AS score
                ORDER BY communityId
                """
            elif algorithm == "temporal":
                # Temporal Timeline Analytics
                query = """
                MATCH (n)-[r]->(m)
                WHERE n.case_id = $case_id AND m.case_id = $case_id
                  AND r.properties IS NOT NULL
                  AND r.properties CONTAINS 'timestamp'
                WITH n, r, m,
                     CASE 
                       WHEN apoc.meta.type(r.properties) = 'STRING' THEN apoc.convert.fromJsonMap(r.properties).timestamp
                       ELSE null 
                     END as ts
                WHERE ts IS NOT NULL
                RETURN 
                    n.id AS source,
                    n.name AS source_name,
                    m.id AS target,
                    m.name AS target_name,
                    type(r) AS event_type,
                    ts AS timestamp
                ORDER BY timestamp DESC
                LIMIT 100
                """
            else:
                # Degree centrality fallback
                query = """
                MATCH (n)
                WHERE n.case_id = $case_id
                OPTIONAL MATCH (n)-[r]-()
                RETURN
                    n.id    AS id,
                    n.name  AS name,
                    labels(n)[0] AS type,
                    count(r) AS score
                ORDER BY score DESC
                LIMIT 50
                """

            result = session.run(query, case_id=case_id)

            if algorithm == "temporal":
                results = [
                    {
                        "source": record["source"],
                        "source_name": record["source_name"],
                        "target": record["target"],
                        "target_name": record["target_name"],
                        "event_type": record["event_type"],
                        "timestamp": record["timestamp"],
                    }
                    for record in result
                ]
            else:
                results = [
                    {
                        "id": record["id"],
                        "name": record["name"],
                        "type": record["type"],
                        "score": record["score"],
                    }
                    for record in result
                ]

            response_data = {
                "case_id": case_id,
                "algorithm": algorithm,
                "nodes": results,
            }
            cache_set(cache_key, response_data, expire_seconds=300)
            return response_data

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Analytics query failed for case {case_id}: {e}")
        # If GDS is missing, fallback to telling the user it's a plugin issue
        if "gds" in str(e).lower() or "procedure" in str(e).lower():
            raise HTTPException(status_code=501, detail="Neo4j GDS plugin not installed.")
        raise HTTPException(status_code=503, detail="Analytics temporarily unavailable.")
