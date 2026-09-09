import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from datetime import datetime, timezone
import uuid
import json

def test_audit_logs_endpoint(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case, AuditLog

    token = create_access_token("user_1", "user@example.com", "HEAD")
    mock_user = User(id="user_1", email="user@example.com", role="HEAD", is_active=True)
    
    mock_log = AuditLog(
        id="log_1",
        actor_id="user_1",
        action_type="LOGIN",
        target_case_id="case_1",
        created_at=datetime.now(timezone.utc),
        extra_metadata=json.dumps({"ip": "127.0.0.1"})
    )

    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
    mock_db_session.query.return_value.join.return_value.join.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
        (mock_log, "user@example.com", "Operation Storm")
    ]

    response = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_200_OK
    logs = response.json()
    assert len(logs) == 1
    assert logs[0]["action"] == "LOGIN"
    assert logs[0]["actor"] == "user@example.com"


def test_users_router_create_and_list(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User

    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)

    # 1. Test create user
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user,  # auth check
        None,       # existing user check (None means user doesn't exist yet)
        head_user   # log_action
    ]

    def mock_refresh(u):
        u.id = "new_inv_id"

    mock_db_session.refresh.side_effect = mock_refresh

    create_resp = client.post(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "newinv@example.com", "password": "password123", "role": "INVESTIGATOR"}
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    assert create_resp.json()["email"] == "newinv@example.com"

    # 2. Test list users
    mock_db_session.query.return_value.filter.return_value.first.return_value = head_user
    mock_db_session.query.return_value.all.return_value = [head_user]

    list_resp = client.get("/api/v1/users/", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.json()) == 1


def test_geospatial_router(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User

    token = create_access_token("inv_1", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="inv_1", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    with patch("api.routers.geospatial.get_graph_session") as mock_get_graph:
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session

        mock_record = {
            "id": "loc-1",
            "name": "Mumbai Port",
            "lat": 18.9438,
            "lng": 72.8541,
            "type": "PORT",
            "timestamp": "2026-09-02",
            "details": "Terminal 4"
        }
        mock_session.run.return_value = [mock_record]

        response = client.get("/api/v1/geospatial/?case_id=case_1", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["label"] == "Mumbai Port"
        assert data[0]["lat"] == 18.9438


def test_graph_router(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case

    case_uuid = str(uuid.uuid4())
    token = create_access_token("head_1", "head@example.com", "HEAD")
    mock_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_case = Case(id=case_uuid, title="Operation Storm", investigators=[mock_user])

    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_user, # get_current_user
        mock_case, # _verify_case_access
        mock_user  # log_action
    ]

    with patch("api.routers.graph.get_graph_session") as mock_get_graph, \
         patch("api.routers.graph.cache_get", return_value=None), \
         patch("api.routers.graph.cache_set"):
        
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session

        mock_node_record = {
            "id": "Person_Vikram",
            "label": "Person",
            "name": "Vikram Mehta",
            "props": {"role": "Kingpin"}
        }
        mock_edge_record = {
            "source": "Person_Vikram",
            "target": "Account_HDFC",
            "type": "OWNS",
            "confidence": 0.95,
            "evidence_id": "ev_1"
        }

        mock_session.run.side_effect = [
            [mock_node_record],
            [mock_edge_record]
        ]

        response = client.get(f"/api/v1/graph/{case_uuid}", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["nodes"]) == 1
        assert len(data["edges"]) == 1
        assert data["nodes"][0]["id"] == "Person_Vikram"
