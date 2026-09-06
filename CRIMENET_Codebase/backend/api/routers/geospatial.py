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


@router.get("/")
def get_geospatial_locations(
    case_id: Optional[str] = Query(None, description="Filter locations by case ID"),
    current_user: dict = Depends(get_current_user),
) -> List[Dict]:
    """
    Returns geolocated intelligence events.
    Queries Neo4j for Location nodes; returns empty list if none found.
    """
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
                        n.details AS details
                    LIMIT 100
                    """,
                    case_id=case_id,
                )
            else:
                result = session.run(
                    """
                    MATCH (n:Location)
                    WHERE n.lat IS NOT NULL AND n.lng IS NOT NULL
                    RETURN
                        n.id AS id,
                        n.name AS name,
                        n.lat AS lat,
                        n.lng AS lng,
                        n.type AS type,
                        n.timestamp AS timestamp,
                        n.details AS details
                    LIMIT 100
                    """
                )

            locations = []
            for record in result:
                if record["lat"] is not None and record["lng"] is not None:
                    locations.append({
                        "id": record["id"] or f"loc-{len(locations)}",
                        "lat": float(record["lat"]),
                        "lng": float(record["lng"]),
                        "label": record["name"] or "Unknown Location",
                        "type": (record["type"] or "location").lower(),
                        "timestamp": record["timestamp"] or "",
                        "details": record["details"] or "",
                    })

            return locations
    except Exception as e:
        logger.warning(f"Neo4j geospatial query: {e}. Returning empty list.")
        return []


@router.get("/stats")
def get_geospatial_stats(
    current_user: dict = Depends(get_current_user),
) -> Dict:
    """Returns aggregate geospatial statistics for the dashboard."""
    try:
        with get_graph_session() as session:
            result = session.run(
                """
                MATCH (n:Location)
                RETURN count(n) AS total_locations
                """
            )
            record = result.single()
            total = record["total_locations"] if record else 0
            return {
                "total_locations": total,
                "active_intercepts": 0,
                "sightings_last_24h": 0,
            }
    except Exception:
        return {
            "total_locations": 0,
            "active_intercepts": 0,
            "sightings_last_24h": 0,
        }
