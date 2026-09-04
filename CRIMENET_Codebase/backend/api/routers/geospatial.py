"""
VEILLE — Geospatial Router
Queries Neo4j for Location nodes tagged to a case.
Falls back to seeded demonstration data if Neo4j is unavailable.
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

# Demonstration locations used as fallback when Neo4j has no Location nodes
FALLBACK_LOCATIONS = [
    {
        "id": "geo-1", "lat": 19.1136, "lng": 72.8697,
        "label": "Rajesh Kumar Sighting (Andheri East)",
        "type": "sighting", "timestamp": "2026-09-01 14:32:00",
        "details": "Target seen entering commercial basement in Black Fortuner MH02DX9912."
    },
    {
        "id": "geo-2", "lat": 19.0760, "lng": 72.8777,
        "label": "Shadow Ring Meeting Point (Bandra)",
        "type": "event", "timestamp": "2026-08-28 21:00:00",
        "details": "Intercepted encrypted transmission pinpoint. 3 known associates confirmed present."
    },
    {
        "id": "geo-3", "lat": 19.0330, "lng": 73.0297,
        "label": "Port Terminal 4 Smuggling Drop",
        "type": "location", "timestamp": "2026-08-15 03:15:00",
        "details": "Container #IN-9022 flagged for unauthorized offloading. Customs alert issued."
    },
    {
        "id": "geo-4", "lat": 18.9220, "lng": 72.8347,
        "label": "Hawala Financial Hub (Colaba)",
        "type": "intercept", "timestamp": "2026-08-22 11:20:00",
        "details": "High-frequency transactions tied to Swiss account #9876. 6 separate wire confirmations."
    },
    {
        "id": "geo-5", "lat": 19.1500, "lng": 72.9830,
        "label": "Vikram Malhotra Residence (Powai)",
        "type": "location", "timestamp": "2026-08-30 07:45:00",
        "details": "Primary residence of financial head. Surveillance camera coverage active."
    },
]


@router.get("/")
def get_geospatial_locations(
    case_id: Optional[str] = Query(None, description="Filter locations by case ID"),
    current_user: dict = Depends(get_current_user),
) -> List[Dict]:
    """
    Returns geolocated intelligence events.
    Queries Neo4j for Location nodes; falls back to demonstration data.
    """
    try:
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

                if locations:
                    return locations
                # Neo4j has no location nodes with coordinates — use fallback
                return FALLBACK_LOCATIONS

        finally:
            pass
    except Exception as e:
        logger.warning(f"Neo4j geospatial query failed: {e}. Using fallback data.")
        return FALLBACK_LOCATIONS


@router.get("/stats")
def get_geospatial_stats(
    current_user: dict = Depends(get_current_user),
) -> Dict:
    """Returns aggregate geospatial statistics for the dashboard."""
    try:
        try:
            with get_graph_session() as session:
                result = session.run(
                    """
                    MATCH (n:Location)
                    RETURN count(n) AS total_locations
                    """
                )
                record = result.single()
                total = record["total_locations"] if record else len(FALLBACK_LOCATIONS)
                return {
                    "total_locations": total,
                    "active_intercepts": 2,
                    "sightings_last_24h": 1,
                }
        finally:
            pass
    except Exception:
        return {
            "total_locations": len(FALLBACK_LOCATIONS),
            "active_intercepts": 2,
            "sightings_last_24h": 1,
        }
