"""
VEILLE — Geospatial Router
Queries Neo4j for Location nodes tagged to a case.
Returns real-time geospatial coordinate vectors or empty lists without mock data.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from api.auth import get_current_user
from core.database import get_db
from core.graph_db import get_graph_session
import logging

logger = logging.getLogger("veille.geospatial")

router = APIRouter(
    prefix="/api/v1/geospatial",
    tags=["geospatial"]
)


@router.get("")
@router.get("/")
def get_geospatial_locations(
    case_id: Optional[str] = Query(None, description="Filter locations by case ID"),
    current_user: dict = Depends(get_current_user),
) -> List[Dict]:
    """
    Returns geolocated intelligence events.
    Queries Neo4j for Location nodes; extracts coordinates from properties or name fallback.
    """
    import json
    from ml.nlp.extractor import resolve_coordinates

    try:
        with get_graph_session() as session:
            if case_id:
                result = session.run(
                    """
                    MATCH (n:Location)
                    WHERE n.case_id = $case_id
                    RETURN
                        n.id AS id,
                        n.name AS name,
                        n.lat AS lat,
                        n.lng AS lng,
                        n.type AS type,
                        n.timestamp AS timestamp,
                        n.details AS details,
                        properties(n) AS props
                    LIMIT 100
                    """,
                    case_id=case_id,
                )
            else:
                result = session.run(
                    """
                    MATCH (n:Location)
                    RETURN
                        n.id AS id,
                        n.name AS name,
                        n.lat AS lat,
                        n.lng AS lng,
                        n.type AS type,
                        n.timestamp AS timestamp,
                        n.details AS details,
                        properties(n) AS props
                    LIMIT 100
                    """
                )

            locations = []
            for record in result:
                lat = record["lat"]
                lng = record["lng"]
                props = dict(record["props"]) if record.get("props") else {}

                # Check inside properties if top-level lat/lng is None
                if lat is None or lng is None:
                    if "lat" in props and "lng" in props:
                        lat, lng = props["lat"], props["lng"]
                    elif "properties" in props and isinstance(props["properties"], str):
                        try:
                            inner = json.loads(props["properties"])
                            if isinstance(inner, dict) and "lat" in inner and "lng" in inner:
                                lat, lng = inner["lat"], inner["lng"]
                        except Exception:
                            pass

                # If still None, geocode from name/location
                if lat is None or lng is None:
                    loc_label = record["name"] or props.get("location_name") or ""
                    coords = resolve_coordinates(loc_label)
                    if coords:
                        lat, lng = coords[0], coords[1]

                if lat is not None and lng is not None:
                    try:
                        lat_val = float(lat)
                        lng_val = float(lng)
                        locations.append({
                            "id": record["id"] or f"loc-{len(locations)}",
                            "lat": lat_val,
                            "lng": lng_val,
                            "label": record["name"] or props.get("location_name") or "Identified Location",
                            "type": (record["type"] or props.get("type") or "location").lower(),
                            "timestamp": record["timestamp"] or props.get("timestamp") or "Identified in Dossier",
                            "details": record["details"] or props.get("location_name") or f"Location extracted from evidence: {record['name']}",
                        })
                    except (ValueError, TypeError):
                        pass

            return locations
    except Exception as e:
        logger.warning(f"Neo4j geospatial query: {e}. Returning empty list.")
        return []


@router.get("/stats")
def get_geospatial_stats(
    case_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
) -> Dict:
    """Returns aggregate geospatial statistics for the dashboard."""
    try:
        with get_graph_session() as session:
            query = "MATCH (n:Location) RETURN count(n) AS total_locations"
            if case_id:
                query = "MATCH (n:Location) WHERE n.case_id = $case_id RETURN count(n) AS total_locations"
            result = session.run(query, case_id=case_id)
            record = result.single()
            total = record["total_locations"] if record else 0

            ic_query = "MATCH ()-[r:COMMUNICATES_WITH]->() RETURN count(r) AS total_intercepts"
            if case_id:
                ic_query = "MATCH (p1)-[r:COMMUNICATES_WITH]->(p2) WHERE p1.case_id = $case_id RETURN count(r) AS total_intercepts"
            ic_res = session.run(ic_query, case_id=case_id).single()
            intercepts = ic_res["total_intercepts"] if ic_res else 0

            return {
                "total_locations": total,
                "active_intercepts": intercepts,
                "sightings_last_24h": total,
            }
    except Exception:
        return {
            "total_locations": 0,
            "active_intercepts": 0,
            "sightings_last_24h": 0,
        }
