import pytest
from fastapi import status
from unittest.mock import patch, MagicMock
import json
import uuid

def test_get_review_queue_unauthorized(client):
    response = client.get("/api/v1/review-queue")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_review_queue_success(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("admin_1", "admin@example.com", "ADMIN")
    mock_user = User(id="admin_1", email="admin@example.com", role="ADMIN", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    mock_redis = MagicMock()
    mock_redis.lrange.return_value = [
        json.dumps({
            "candidate_id": "Person_123",
            "match_id": "Person_456",
            "case_id": "case_1",
            "confidence": 0.75
        })
    ]

    with patch("api.routers.review_queue.get_redis", return_value=mock_redis):
        response = client.get(
            "/api/v1/review-queue",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["pending_count"] == 1
        assert data["items"][0]["candidate_id"] == "Person_123"
        assert data["items"][0]["match_id"] == "Person_456"
        assert "review_id" in data["items"][0]

def test_merge_entity_success(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("admin_1", "admin@example.com", "ADMIN")
    mock_user = User(id="admin_1", email="admin@example.com", role="ADMIN", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    raw_item = {
        "candidate_id": "Person_123",
        "match_id": "Person_456",
        "case_id": "case_1",
        "confidence": 0.75
    }
    
    # Generate the expected review_id based on the logic in review_queue.py
    import uuid as _uuid
    review_id = str(_uuid.uuid5(_uuid.NAMESPACE_DNS, "Person_123Person_456"))

    mock_redis = MagicMock()
    mock_redis.lrange.return_value = [json.dumps(raw_item)]

    with patch("api.routers.review_queue.get_redis", return_value=mock_redis), \
         patch("core.graph_db.get_graph_session") as mock_get_graph:
        
        mock_graph_session = MagicMock()
        mock_get_graph.return_value = mock_graph_session

        response = client.post(
            "/api/v1/review-queue/merge",
            headers={"Authorization": f"Bearer {token}"},
            json={"review_id": review_id, "notes": "Looks good"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "merged"
        
        mock_graph_session.run.assert_called_once()
        mock_redis.lrem.assert_called_once()
        mock_redis.lpush.assert_called_once()

def test_reject_merge_success(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("admin_1", "admin@example.com", "ADMIN")
    mock_user = User(id="admin_1", email="admin@example.com", role="ADMIN", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    raw_item = {
        "candidate_id": "Person_123",
        "match_id": "Person_456",
        "case_id": "case_1",
        "confidence": 0.75
    }
    
    import uuid as _uuid
    review_id = str(_uuid.uuid5(_uuid.NAMESPACE_DNS, "Person_123Person_456"))

    mock_redis = MagicMock()
    mock_redis.lrange.return_value = [json.dumps(raw_item)]

    with patch("api.routers.review_queue.get_redis", return_value=mock_redis):
        
        response = client.post(
            "/api/v1/review-queue/reject",
            headers={"Authorization": f"Bearer {token}"},
            json={"review_id": review_id, "notes": "Different person"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "rejected"
        
        mock_redis.lrem.assert_called_once()
        mock_redis.lpush.assert_called_once()

def test_get_dlq_success(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User
    
    token = create_access_token("admin_1", "admin@example.com", "ADMIN")
    mock_user = User(id="admin_1", email="admin@example.com", role="ADMIN", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    mock_redis = MagicMock()
    mock_redis.lrange.return_value = [
        json.dumps({
            "task_id": "task_123",
            "error": "Something went wrong"
        })
    ]

    with patch("api.routers.review_queue.get_redis", return_value=mock_redis):
        response = client.get(
            "/api/v1/admin/dlq",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["dlq_size"] == 1
        assert data["items"][0]["task_id"] == "task_123"
