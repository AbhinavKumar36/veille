import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime
import json
import uuid

from api.auth import create_access_token, get_password_hash
from db.models import User, Case, Evidence, AuditLog


def test_frontend_auth_contract(client: TestClient, mock_db_session):
    """Verifies frontend client.ts authentication endpoints: /auth/login and /auth/refresh."""
    hashed = get_password_hash("admin123")
    user = User(id="user_admin", email="admin@veille.gov.in", hashed_password=hashed, role="HEAD", is_active=True)

    # 1. Login with valid credentials
    mock_db_session.query.return_value.filter.return_value.first.return_value = user
    with patch("redis.Redis.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_redis.return_value = mock_r
        mock_r.get.return_value = "0"

        login_res = client.post("/api/v1/auth/login", json={"email": "admin@veille.gov.in", "password": "admin123"})
        assert login_res.status_code == 200
        data = login_res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@veille.gov.in"
        assert "refresh_token" in login_res.cookies

    # 2. Refresh Token endpoint called by frontend tryRefreshToken()
    mock_db_session.query.return_value.filter.return_value.first.return_value = user
    with patch("redis.Redis.from_url") as mock_redis:
        mock_r = MagicMock()
        mock_redis.return_value = mock_r
        mock_r.exists.return_value = False

        from api.auth import create_refresh_token
        ref_token = create_refresh_token("user_admin")
        client.cookies.set("refresh_token", ref_token)

        refresh_res = client.post("/api/v1/auth/refresh")
        assert refresh_res.status_code == 200
        assert "access_token" in refresh_res.json()


def test_frontend_cases_and_stats_contract(client: TestClient, mock_db_session):
    """Verifies Dashboard.tsx / Cases endpoints: /cases/ and /cases/:case_id/stats."""
    token = create_access_token("user_admin", "admin@veille.gov.in", "HEAD")
    headers = {"Authorization": f"Bearer {token}"}
    admin_user = User(id="user_admin", email="admin@veille.gov.in", role="HEAD", is_active=True)

    mock_case = Case(
        id="case_100",
        title="Operation Falcon",
        description="Smuggling syndicate",
        priority="HIGH",
        status="OPEN",
        created_at=datetime.utcnow(),
        investigators=[admin_user],
    )

    mock_db_session.query.return_value.filter.return_value.first.return_value = admin_user
    mock_db_session.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_case]
    mock_db_session.query.return_value.filter.return_value.count.return_value = 3

    # 1. GET /cases/
    res = client.get("/api/v1/cases/", headers=headers)
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 1
    assert cases[0]["title"] == "Operation Falcon"

    # 2. GET /cases/:id/stats
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [admin_user, mock_case]
    with patch("api.routers.cases.get_graph_session") as mock_get_graph:
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_result = MagicMock()
        mock_result.single.return_value = {"nodes": 12, "edges": 8}
        mock_session.run.return_value = mock_result

        stats_res = client.get("/api/v1/cases/case_100/stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["node_count"] == 12
        assert stats["edge_count"] == 8
        assert stats["evidence_count"] == 3


def test_frontend_network_explorer_graph_contract(client: TestClient, mock_db_session):
    """Verifies NetworkExplorer.tsx endpoint: /graph/:case_id."""
    token = create_access_token("user_admin", "admin@veille.gov.in", "HEAD")
    headers = {"Authorization": f"Bearer {token}"}
    admin_user = User(id="user_admin", email="admin@veille.gov.in", role="HEAD", is_active=True)

    case_uuid = uuid.uuid4()
    mock_case = Case(
        id=case_uuid,
        title="Operation Falcon",
        investigators=[admin_user],
    )

    def mock_query(model):
        m = MagicMock()
        if model == User:
            m.filter.return_value.first.return_value = admin_user
        elif model == Case:
            m.filter.return_value.first.return_value = mock_case
        return m

    mock_db_session.query.side_effect = mock_query

    with patch("api.routers.graph.get_graph_session") as mock_get_graph, \
         patch("api.routers.graph.cache_get", return_value=None), \
         patch("api.routers.graph.cache_set"):
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        
        mock_session.run.side_effect = [
            [
                {
                    "id": "Person_Vikram",
                    "name": "Vikram Mehta",
                    "label": "Person",
                    "props": {"role": "Mastermind", "case_id": str(case_uuid)},
                }
            ],
            [
                {
                    "source": "Person_Vikram",
                    "target": "Account_HDFC",
                    "type": "OWNS",
                    "confidence": 0.95,
                    "evidence_id": "ev_1",
                }
            ],
        ]

        res = client.get(f"/api/v1/graph/{case_uuid}", headers=headers)
        assert res.status_code == 200
        graph_data = res.json()
        assert "nodes" in graph_data
        assert "edges" in graph_data or "links" in graph_data
        assert len(graph_data["nodes"]) == 1
        assert graph_data["nodes"][0]["name"] == "Vikram Mehta"


def test_frontend_evidence_library_contract(client: TestClient, mock_db_session):
    """Verifies EvidenceLibrary.tsx endpoints: /evidence/ (GET) and /evidence/upload (POST)."""
    token = create_access_token("user_admin", "admin@veille.gov.in", "HEAD")
    headers = {"Authorization": f"Bearer {token}"}
    admin_user = User(id="user_admin", email="admin@veille.gov.in", role="HEAD", is_active=True)

    mock_case = Case(id="case_100", title="Operation Falcon", investigators=[admin_user])

    mock_ev = Evidence(
        id=uuid.uuid4(),
        case_id="case_100",
        source_type="FIR",
        original_filename="fir.txt",
        file_path="uploads/fir.txt",
        status="PROCESSED",
        hash="abc123hash",
        created_at=datetime.utcnow(),
    )

    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        admin_user, # auth check for GET
        mock_case,  # case access check for GET
    ]
    mock_db_session.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_ev]

    # 1. GET /evidence/case_100
    res = client.get("/api/v1/evidence/case_100", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["source_type"] == "FIR"

    # 2. POST /evidence/upload
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        admin_user, # auth check
        mock_case,  # case existence
        None,       # hash duplicate check
        admin_user  # log_action
    ]
    with patch("api.routers.ingestion.extract_entities_task") as mock_task, \
         patch("builtins.open", MagicMock()):
        mock_task_res = MagicMock(id="task_12345")
        mock_task.delay.return_value = mock_task_res
        upload_res = client.post(
            "/api/v1/evidence/upload",
            data={"case_id": "case_100", "source_type": "FIR"},
            files={"file": ("report.txt", b"Suspect Vikram Mehta met Elena Rostova", "text/plain")},
            headers=headers,
        )
        assert upload_res.status_code == 202
        up_data = upload_res.json()
        assert "evidence_id" in up_data
        assert up_data["job_id"] == "task_12345"






def test_frontend_review_queue_contract(client: TestClient, mock_db_session):
    """Verifies ReviewQueue.tsx & Dashboard.tsx review actions: /review-queue, /merge, /reject."""
    token = create_access_token("user_admin", "admin@veille.gov.in", "HEAD")
    headers = {"Authorization": f"Bearer {token}"}
    admin_user = User(id="user_admin", email="admin@veille.gov.in", role="HEAD", is_active=True)

    mock_item = {
        "candidate_id": "P_Vikram",
        "candidate_name": "Vikram Mehta",
        "candidate_label": "Person",
        "match_id": "P_VMehta",
        "match_name": "V. Mehta",
        "total_confidence": 0.72,
        "case_id": "case_1",
    }
    raw_json = json.dumps(mock_item)
    mock_db_session.query.return_value.filter.return_value.first.return_value = admin_user

    with patch("api.routers.review_queue.get_redis") as mock_get_r:
        mock_r = MagicMock()
        mock_get_r.return_value = mock_r
        mock_r.lrange.return_value = [raw_json]

        # 1. GET /review-queue
        res = client.get("/api/v1/review-queue", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["pending_count"] == 1
        review_id = data["items"][0]["review_id"]

        # 2. POST /review-queue/merge (with review_id or task_id)
        with patch("core.graph_db.get_graph_session") as mock_get_graph:
            mock_session = MagicMock()
            mock_get_graph.return_value.__enter__.return_value = mock_session
            merge_res = client.post(
                "/api/v1/review-queue/merge",
                json={"task_id": "P_Vikram", "notes": "Confirmed match"},
                headers=headers,
            )
            assert merge_res.status_code == 200
            assert merge_res.json()["status"] == "merged"

        # 3. POST /review-queue/reject
        reject_res = client.post(
            "/api/v1/review-queue/reject",
            json={"review_id": review_id, "notes": "Different person"},
            headers=headers,
        )
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] == "rejected"


def test_frontend_ai_assistant_chat_contract(client: TestClient, mock_db_session):
    """Verifies AIAssistant.tsx chat query endpoint: /ai/chat."""
    token = create_access_token("user_admin", "admin@veille.gov.in", "HEAD")
    headers = {"Authorization": f"Bearer {token}"}
    admin_user = User(id="user_admin", email="admin@veille.gov.in", role="HEAD", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = admin_user

    with patch("api.routers.ai.get_graph_session") as mock_get_graph:
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_session.run.side_effect = [
            [{"name": "Vikram Mehta", "type": "Person", "props": {"role": "Mastermind"}}],
            [{"source": "Vikram Mehta", "rel": "OWNS", "target": "Zenith Logistics", "conf": 0.95, "ev_id": "ev-01"}],
        ]

        chat_res = client.post(
            "/api/v1/ai/chat",
            json={"message": "What do we know about Vikram Mehta?"},
            headers=headers,
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "response" in data
        assert len(data["response"]) > 10
        assert "entities" in data
        assert "citations" in data


def test_frontend_audit_logs_contract(client: TestClient, mock_db_session):
    """Verifies AuditLogs.tsx query endpoint: /audit-logs."""
    token = create_access_token("user_admin", "admin@veille.gov.in", "HEAD")
    headers = {"Authorization": f"Bearer {token}"}
    admin_user = User(id="user_admin", email="admin@veille.gov.in", role="HEAD", is_active=True)

    mock_log = AuditLog(
        id=uuid.uuid4(),
        actor_id=uuid.uuid4(),
        action_type="QUERY_GRAPH",
        target_case_id=uuid.uuid4(),
        created_at=datetime.utcnow(),
    )

    mock_db_session.query.return_value.filter.return_value.first.return_value = admin_user
    mock_db_session.query.return_value.join.return_value.join.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
        (mock_log, "admin@veille.gov.in", "Operation Falcon")
    ]

    logs_res = client.get("/api/v1/audit-logs?limit=50", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) == 1
    assert logs[0]["action"] == "QUERY_GRAPH"
    assert logs[0]["actor"] == "admin@veille.gov.in"




