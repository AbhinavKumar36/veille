import pytest
from unittest.mock import patch, MagicMock

from ml.entity_resolution.resolver import EntityResolver, ResolutionResult
from ml.nlp.schemas import ExtractedGraph, ExtractedEntity, ExtractedRelation


@pytest.fixture
def resolver():
    return EntityResolver()


def test_lexical_similarity(resolver):
    # Exact match
    assert resolver.lexical_similarity("Rajesh Kumar", "Rajesh Kumar") == 1.0
    
    # Case insensitive and stripped
    assert resolver.lexical_similarity(" rajesh kumar ", "RAJESH KUMAR") == 1.0
    
    # Very similar (order swapped, should have high similarity with rapidfuzz)
    sim = resolver.lexical_similarity("Rajesh Kumar", "Kumar Rajesh")
    assert sim > 0.7
    
    # Completely different
    assert resolver.lexical_similarity("Rajesh", "Amit") < 0.5


def test_structural_similarity(resolver):
    # Same neighbours
    assert resolver.structural_similarity(["n1", "n2"], ["n2", "n1"]) == 1.0
    
    # Partial match: intersection is n2 (size 1), union is n1, n2, n3 (size 3) -> 1/3
    sim = resolver.structural_similarity(["n1", "n2"], ["n2", "n3"])
    assert 0.33 < sim < 0.34
    
    # No match
    assert resolver.structural_similarity(["n1"], ["n2"]) == 0.0
    
    # Empty lists
    assert resolver.structural_similarity([], ["n1"]) == 0.0


def test_resolve_entity_auto_merge(resolver):
    # Mock Neo4j return
    db_candidates = [
        {"id": "person_123", "name": "Rajesh Kumar", "neighbours": ["n1", "n2"]}
    ]
    with patch.object(resolver, "get_candidates_from_graph", return_value=db_candidates):
        result = resolver.resolve_entity("Rajesh Kumar", "Person", ["n1", "n2"], "case_1")
        
    assert result.action == "AUTO_MERGE"
    assert result.match_id == "person_123"
    assert result.total_confidence >= 0.85


def test_resolve_entity_review_queue(resolver):
    # Mock Neo4j return: name matches, but neighbours only partially match.
    # The score should fall between 0.5 and 0.85
    db_candidates = [
        {"id": "person_123", "name": "Rajesh K", "neighbours": ["n3", "n4"]}
    ]
    with patch.object(resolver, "get_candidates_from_graph", return_value=db_candidates):
        result = resolver.resolve_entity("Rajesh Kumar", "Person", ["n1", "n3"], "case_1")
        
    assert result.action == "REVIEW_QUEUE"
    assert result.match_id == "person_123"
    assert 0.5 <= result.total_confidence < 0.85


def test_resolve_entity_create_new(resolver):
    # Completely different
    db_candidates = [
        {"id": "person_123", "name": "Amit Singh", "neighbours": ["n3", "n4"]}
    ]
    with patch.object(resolver, "get_candidates_from_graph", return_value=db_candidates):
        result = resolver.resolve_entity("Rajesh Kumar", "Person", ["n1", "n2"], "case_1")
        
    assert result.action == "CREATE_NEW"
    assert result.match_id is None
    assert result.total_confidence < 0.5


@patch("redis.Redis.from_url")
def test_resolve_extracted_graph(mock_redis, resolver):
    # Setup extracted graph
    graph = ExtractedGraph(
        entities=[
            ExtractedEntity(id="e1", label="Person", name="Rajesh Kumar"),
            ExtractedEntity(id="e2", label="Person", name="Amit Singh"),
        ],
        relationships=[]
    )
    
    # e1 should auto merge, e2 should create new
    def mock_resolve(*args, **kwargs):
        name = kwargs.get("candidate_name") or args[0]
        label = kwargs.get("candidate_label") or args[1]
        if name == "Rajesh Kumar":
            return ResolutionResult("", name, label, "db_rajesh", name, 1.0, 1.0, 1.0, "AUTO_MERGE")
        return ResolutionResult("", name, label, None, None, 0.0, 0.0, 0.0, "CREATE_NEW")
        
    with patch.object(resolver, "resolve_entity", side_effect=mock_resolve):
        res = resolver.resolve_extracted_graph(graph, "case_1")
        
    assert res["auto_merged"] == 1
    assert res["new_entities"] == 1
    assert res["queued_for_review"] == 0
    # The resolved graph should only contain the CREATE_NEW entities (e2)
    # as e1 was merged away (ID remapped in relationships)
    assert len(res["resolved_graph"].entities) == 1
    assert res["resolved_graph"].entities[0].id == "e2"
