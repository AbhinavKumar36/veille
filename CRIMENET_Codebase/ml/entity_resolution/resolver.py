"""
VEILLE v4.0 — Entity Resolution Engine
Determines whether a newly extracted entity is a known entity in the graph
or a new one, using a two-stage matching pipeline:

Stage 1: Lexical similarity (RapidFuzz — Jaro-Winkler distance)
Stage 2: Graph proximity (shared Neo4j neighbours)

Confidence Thresholds (from IMPL_05_ENTITY_RESOLUTION_SPEC.md):
  ≥ 0.85 → AUTO_MERGE   (system merges automatically)
  0.50–0.85 → REVIEW_QUEUE (investigator confirms)
  < 0.50  → CREATE_NEW  (treated as a distinct new entity)
"""
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("veille.entity_resolution")

# Confidence thresholds
THRESHOLD_AUTO_MERGE = 0.85
THRESHOLD_REVIEW = 0.50

# Weights for the composite score
WEIGHT_LEXICAL = 0.55
WEIGHT_STRUCTURAL = 0.45

# Allowed Neo4j node labels to prevent Cypher injection
ALLOWED_LABELS = {"Person", "Organization", "Location", "Phone", "Account", "Vehicle", "Event", "Document"}


@dataclass
class ResolutionResult:
    candidate_id: str
    candidate_name: str
    candidate_label: str
    match_id: Optional[str]
    match_name: Optional[str]
    lexical_score: float
    structural_score: float
    total_confidence: float
    action: str  # AUTO_MERGE | REVIEW_QUEUE | CREATE_NEW


class EntityResolver:
    """
    Resolves candidate entities (from NLP extraction) against the existing
    Neo4j knowledge graph using lexical + structural similarity.
    """

    def __init__(self):
        self._fuzzy = None
        self._load_rapidfuzz()

    def _load_rapidfuzz(self):
        """Lazy-load RapidFuzz — falls back to difflib if not installed."""
        try:
            from rapidfuzz import fuzz
            self._fuzzy = fuzz
            logger.info("RapidFuzz loaded for entity resolution.")
        except ImportError:
            logger.warning(
                "RapidFuzz not installed. Falling back to difflib (lower accuracy). "
                "Install with: pip install rapidfuzz"
            )
            self._fuzzy = None

    # ── Lexical Similarity ────────────────────────────────────────────────

    def lexical_similarity(self, a: str, b: str) -> float:
        """
        Compute Jaro-Winkler similarity between two strings.
        - RapidFuzz: uses C-optimised Jaro-Winkler (preferred)
        - Fallback: difflib SequenceMatcher (pure Python, similar semantics)

        Returns float in [0.0, 1.0].
        """
        if not a or not b:
            return 0.0
        a, b = a.strip().lower(), b.strip().lower()
        if a == b:
            return 1.0

        if self._fuzzy:
            # token_set_ratio handles name reordering: "Kumar Rajesh" ↔ "Rajesh Kumar"
            token_score = self._fuzzy.token_set_ratio(a, b) / 100.0
            ratio_score = self._fuzzy.ratio(a, b) / 100.0
            # Average of both to balance exact matching and token reordering
            return (token_score + ratio_score) / 2.0
        else:
            import difflib
            return difflib.SequenceMatcher(None, a, b).ratio()

    # ── Graph-Proximity Similarity ────────────────────────────────────────

    def structural_similarity(
        self,
        candidate_neighbours: List[str],
        db_neighbours: List[str],
    ) -> float:
        """
        Jaccard similarity between the neighbour sets of two nodes.
        If two people share the same phone number, they're very likely the same person.

        Returns float in [0.0, 1.0].
        """
        if not candidate_neighbours or not db_neighbours:
            return 0.0

        set_a = set(candidate_neighbours)
        set_b = set(db_neighbours)
        intersection = set_a & set_b
        union = set_a | set_b

        if not union:
            return 0.0

        return len(intersection) / len(union)

    # ── Composite Scoring ─────────────────────────────────────────────────

    def score(
        self,
        candidate_name: str,
        candidate_neighbours: List[str],
        db_name: str,
        db_neighbours: List[str],
    ) -> Tuple[float, float, float]:
        """
        Compute composite confidence = weighted lexical + structural.

        Returns: (lexical_score, structural_score, total_confidence)
        """
        lex = self.lexical_similarity(candidate_name, db_name)
        struct = self.structural_similarity(candidate_neighbours, db_neighbours)
        total = min(1.0, (lex * WEIGHT_LEXICAL) + (struct * WEIGHT_STRUCTURAL))
        return round(lex, 4), round(struct, 4), round(total, 4)

    @staticmethod
    def _action(confidence: float) -> str:
        if confidence >= THRESHOLD_AUTO_MERGE:
            return "AUTO_MERGE"
        elif confidence >= THRESHOLD_REVIEW:
            return "REVIEW_QUEUE"
        return "CREATE_NEW"

    # ── Neo4j Candidate Lookup ────────────────────────────────────────────

    def get_candidates_from_graph(
        self,
        candidate_name: str,
        candidate_label: str,
        case_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Query Neo4j for existing nodes of the same label in this case,
        along with their neighbour IDs (for structural matching).

        Returns a list of dicts: [{id, name, neighbours: [str]}, ...]
        """
        try:
            if candidate_label not in ALLOWED_LABELS:
                logger.error(f"Cypher injection prevented: Invalid label '{candidate_label}'")
                return []
                
            from core.graph_db import get_graph_session
            with get_graph_session() as session:
                result = session.run(
                    """
                    MATCH (n:{label})
                    WHERE n.case_id = $case_id
                    OPTIONAL MATCH (n)-[]-(neighbour)
                    RETURN
                        n.id     AS id,
                        n.name   AS name,
                        collect(neighbour.id) AS neighbour_ids
                    """.format(label=candidate_label),
                    case_id=case_id,
                )
                return [
                    {
                        "id": record["id"],
                        "name": record["name"],
                        "neighbours": [nid for nid in record["neighbour_ids"] if nid],
                    }
                    for record in result
                ]
        except Exception as e:
            logger.error(f"Failed to query Neo4j candidates for '{candidate_name}': {e}")
            return []

    # ── Main Resolution Method ────────────────────────────────────────────

    def resolve_entity(
        self,
        candidate_name: str,
        candidate_label: str,
        candidate_neighbours: List[str],
        case_id: str,
    ) -> ResolutionResult:
        """
        Resolve a single candidate entity against all existing entities of
        the same type in the case's knowledge graph.

        Returns the best match (or CREATE_NEW if no match exceeds threshold).
        """
        db_candidates = self.get_candidates_from_graph(
            candidate_name, candidate_label, case_id
        )

        if not db_candidates:
            return ResolutionResult(
                candidate_id="",
                candidate_name=candidate_name,
                candidate_label=candidate_label,
                match_id=None,
                match_name=None,
                lexical_score=0.0,
                structural_score=0.0,
                total_confidence=0.0,
                action="CREATE_NEW",
            )

        best_confidence = -1.0
        best_candidate = None
        best_lex = 0.0
        best_struct = 0.0

        for db_node in db_candidates:
            lex, struct, total = self.score(
                candidate_name,
                candidate_neighbours,
                db_node["name"] or "",
                db_node["neighbours"],
            )
            if total > best_confidence:
                best_confidence = total
                best_candidate = db_node
                best_lex = lex
                best_struct = struct

        action = self._action(best_confidence)

        logger.info(
            f"Entity resolution: '{candidate_name}' → '{best_candidate['name']}' "
            f"(lex={best_lex}, struct={best_struct}, total={best_confidence}, action={action})"
        )

        return ResolutionResult(
            candidate_id="",
            candidate_name=candidate_name,
            candidate_label=candidate_label,
            match_id=best_candidate["id"] if action != "CREATE_NEW" else None,
            match_name=best_candidate["name"] if action != "CREATE_NEW" else None,
            lexical_score=best_lex,
            structural_score=best_struct,
            total_confidence=best_confidence,
            action=action,
        )

    # ── Batch resolution for a full extracted graph ───────────────────────

    def resolve_extracted_graph(
        self, extracted_graph, case_id: str
    ) -> Dict[str, Any]:
        """
        Resolve all entities in an ExtractedGraph against the existing knowledge graph.

        Returns a dict with:
          - resolved_graph: ExtractedGraph (entities renamed to matched IDs where AUTO_MERGE)
          - review_items: List of REVIEW_QUEUE items to store in DB
          - auto_merged: count
          - queued_for_review: count
          - new_entities: count
        """
        id_remap: Dict[str, str] = {}  # old_id → canonical_id
        review_items = []
        auto_merged = 0
        queued = 0
        new_entities = 0

        # Build candidate neighbours from within this extraction batch
        # (entities extracted together are likely related)
        intra_batch_neighbours: Dict[str, List[str]] = {
            e.id: [] for e in extracted_graph.entities
        }
        for rel in extracted_graph.relationships:
            intra_batch_neighbours.setdefault(rel.source_id, []).append(rel.target_id)
            intra_batch_neighbours.setdefault(rel.target_id, []).append(rel.source_id)

        for entity in extracted_graph.entities:
            candidate_neighbours = intra_batch_neighbours.get(entity.id, [])

            result = self.resolve_entity(
                candidate_name=entity.name,
                candidate_label=entity.label,
                candidate_neighbours=candidate_neighbours,
                case_id=case_id,
            )

            if result.action == "AUTO_MERGE":
                id_remap[entity.id] = result.match_id
                auto_merged += 1

            elif result.action == "REVIEW_QUEUE":
                # Keep original entity ID for now; human decides at review time
                id_remap[entity.id] = entity.id
                review_items.append({
                    "candidate_id": entity.id,
                    "candidate_name": entity.name,
                    "candidate_label": entity.label,
                    "match_id": result.match_id,
                    "match_name": result.match_name,
                    "lexical_score": result.lexical_score,
                    "structural_score": result.structural_score,
                    "total_confidence": result.total_confidence,
                    "case_id": case_id,
                })
                queued += 1

            else:  # CREATE_NEW
                id_remap[entity.id] = entity.id
                new_entities += 1

        # Rewrite relationship IDs to use canonical merged IDs
        from ml.nlp.schemas import ExtractedGraph, ExtractedEntity, ExtractedRelation
        resolved_entities = [
            entity for entity in extracted_graph.entities
            if id_remap.get(entity.id) == entity.id  # Only new/queued (not merged-away)
        ]
        resolved_relationships = [
            ExtractedRelation(
                source_id=id_remap.get(rel.source_id, rel.source_id),
                target_id=id_remap.get(rel.target_id, rel.target_id),
                type=rel.type,
                confidence=rel.confidence,
                properties=rel.properties,
            )
            for rel in extracted_graph.relationships
        ]

        resolved_graph = ExtractedGraph(
            entities=resolved_entities,
            relationships=resolved_relationships,
        )

        # Store review items in Redis for the review queue API
        if review_items:
            self._store_review_items(review_items)

        return {
            "resolved_graph": resolved_graph,
            "review_items": review_items,
            "auto_merged": auto_merged,
            "queued_for_review": queued,
            "new_entities": new_entities,
        }

    def _store_review_items(self, items: List[Dict]) -> None:
        """Push review queue items to Redis for the review queue API."""
        try:
            import redis, os
            r = redis.Redis.from_url(
                os.getenv("REDIS_URL", "redis://localhost:6379/0"),
                decode_responses=True,
            )
            for item in items:
                r.lpush("review_queue:pending", json.dumps(item))
            logger.info(f"Pushed {len(items)} items to review queue")
        except Exception as e:
            logger.error(f"Failed to store review items in Redis: {e}")
