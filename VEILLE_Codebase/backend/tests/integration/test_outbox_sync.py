import pytest
from unittest.mock import patch, MagicMock
import json
from datetime import datetime, timezone

from workers.outbox_processor import process_outbox_events
from db.models import OutboxEvent

@patch("workers.outbox_processor.SessionLocal")
@patch("workers.outbox_processor.get_graph_session")
@patch("workers.outbox_processor._get_redis_client")
def test_outbox_sync_node_upsert(mock_get_redis, mock_get_graph_session, mock_session_local):
    """Test outbox processor successfully applies a NODE_UPSERT event."""
    # 1. Setup mock database
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    mock_redis = MagicMock()
    mock_get_redis.return_value = mock_redis
    
    # Setup mock event
    event = OutboxEvent(
        id=1,
        event_type="NODE_UPSERT",
        payload=json.dumps({
            "id": "Person_John",
            "case_id": "case_1",
            "label": "Person",
            "name": "John Doe",
            "properties": {"age": "30"},
            "source_evidence_id": "ev_1"
        }),
        status="PENDING",
        retries=0,
        created_at=datetime.now(timezone.utc)
    )
    
    # Mock the SQLAlchemy query chain
    mock_query = mock_db.query.return_value
    mock_query.filter.return_value.filter.return_value.order_by.return_value.limit.return_value.with_for_update.return_value.all.return_value = [event]
    
    # 2. Setup mock graph session
    mock_graph = MagicMock()
    mock_get_graph_session.return_value.__enter__.return_value = mock_graph
    
    # 3. Call the processor
    process_outbox_events()
    
    # 4. Verify outcomes
    # Verify Neo4j was called
    mock_graph.run.assert_called_once()
    args, kwargs = mock_graph.run.call_args
    assert "MERGE (n:Person" in args[0]
    assert kwargs["id"] == "Person_John"
    
    # Verify DB state was updated
    assert event.status == "PROCESSED"
    assert event.error_message is None
    mock_db.commit.assert_called_once()


@patch("workers.outbox_processor.SessionLocal")
@patch("workers.outbox_processor.get_graph_session")
@patch("workers.outbox_processor._get_redis_client")
def test_outbox_sync_failure_and_dlq(mock_get_redis, mock_get_graph_session, mock_session_local):
    """Test outbox processor handles Neo4j failures and moves to DLQ on max retries."""
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    
    event = OutboxEvent(
        id=2,
        event_type="NODE_UPSERT",
        payload=json.dumps({
            "id": "Person_Jane",
            "case_id": "case_1",
            "label": "Person",
            "name": "Jane Doe",
            "properties": {},
            "source_evidence_id": "ev_1"
        }),
        status="PENDING",
        retries=4, # 4 retries, this will be the 5th (MAX_RETRIES)
        created_at=datetime.now(timezone.utc)
    )
    
    mock_query = mock_db.query.return_value
    mock_query.filter.return_value.filter.return_value.order_by.return_value.limit.return_value.with_for_update.return_value.all.return_value = [event]
    
    # Setup graph to fail
    mock_graph = MagicMock()
    mock_graph.run.side_effect = Exception("Neo4j is down")
    mock_get_graph_session.return_value.__enter__.return_value = mock_graph
    
    mock_redis = MagicMock()
    mock_get_redis.return_value = mock_redis
    
    process_outbox_events()
    
    # Verify event failed
    assert event.status == "FAILED"
    assert event.retries == 5
    assert "Neo4j is down" in event.error_message
    
    # Verify DLQ was called
    mock_redis.lpush.assert_called_once()
    args, _ = mock_redis.lpush.call_args
    assert args[0] == "dlq:outbox_failed"
    dlq_payload = json.loads(args[1])
    assert dlq_payload["task_id"] == "outbox_2"
    assert dlq_payload["error"] == "Neo4j is down"
    
    mock_db.commit.assert_called_once()
