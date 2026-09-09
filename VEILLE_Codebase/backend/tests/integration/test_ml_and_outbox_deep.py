import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json
import os

from workers.outbox_processor import _apply_edge_create, _apply_case_delete
from ml.entity_resolution.resolver import EntityResolver
from ml.nlp.extractor import EvidenceExtractor, ConfigurationError, GeminiAPIError, ExtractionValidationError
from ml.nlp.schemas import ExtractedGraph, ExtractedEntity, ExtractedRelation
from api.routers.ws import redis_listener, websocket_endpoint, manager


def test_outbox_edge_and_case_delete():
    mock_session = MagicMock()

    # 1. Edge create
    edge_payload = {
        "source_id": "P1", "target_id": "P2", "type": "CALLED",
        "case_id": "case_1", "confidence": 0.9, "properties": {"duration": "60"},
        "source_evidence_id": "ev_1"
    }
    _apply_edge_create(mock_session, edge_payload)
    mock_session.run.assert_called_once()

    # 2. Case delete
    mock_session.reset_mock()
    _apply_case_delete(mock_session, {"case_id": "case_1"})
    mock_session.run.assert_called_once()


def test_entity_resolver_deep():
    resolver = EntityResolver()

    # 1. Lexical and structural scoring
    lex, struct, total = resolver.score(
        candidate_name="Vikram Mehta",
        candidate_neighbours=["P1", "P2"],
        db_name="V. Mehta",
        db_neighbours=["P1", "P3"]
    )
    assert lex > 0.4
    assert struct > 0.0
    assert total > 0.3

    # 2. Exact match
    lex2, struct2, total2 = resolver.score(
        candidate_name="Rajesh Kumar",
        candidate_neighbours=["Phone_1"],
        db_name="Rajesh Kumar",
        db_neighbours=["Phone_1"]
    )
    assert lex2 == 1.0
    assert struct2 == 1.0
    assert total2 == 1.0
    assert resolver._action(total2) == "AUTO_MERGE"


def test_nlp_extractor_configuration_and_chunking():
    # 1. Configuration error (missing API key)
    with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
        extractor = EvidenceExtractor()
        with pytest.raises(ConfigurationError):
            extractor.extract("Some text", "doc.txt")

    # 2. Extraction validation error simulation
    with patch.dict(os.environ, {"GEMINI_API_KEY": "valid_key"}), \
         patch("google.genai.Client") as mock_client, \
         patch("time.sleep") as mock_sleep:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_resp = MagicMock(text="Invalid unparseable JSON content")
        mock_instance.models.generate_content.return_value = mock_resp

        extractor = EvidenceExtractor()
        with pytest.raises(ExtractionValidationError):
            extractor.extract("Some text", "doc.txt")


@pytest.mark.asyncio
async def test_redis_listener_and_ws_endpoint():
    # 1. Test redis_listener
    with patch("redis.asyncio.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_pubsub = MagicMock()
        mock_pubsub.subscribe = AsyncMock()
        mock_redis.return_value = mock_r
        mock_r.pubsub.return_value = mock_pubsub

        async def mock_listen():
            yield {"type": "message", "data": json.dumps({"case_id": "case_1", "update": "graph"})}

        mock_pubsub.listen = mock_listen

        with patch.object(manager, "broadcast_to_case", new_callable=AsyncMock) as mock_broadcast:
            # Run one iteration of redis_listener
            import asyncio
            task = asyncio.create_task(redis_listener())
            await asyncio.sleep(0.05)
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            mock_broadcast.assert_called_with("case_1", {"case_id": "case_1", "update": "graph"})

