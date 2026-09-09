import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import status
import json
import uuid

from api.auth import create_access_token
from db.models import User, Case, Evidence
from workers.base_task import CrimenetBaseTask, _update_evidence_status
from workers.tasks import extract_entities_task, process_structured_data_task
from api.routers.ws import ConnectionManager


@pytest.mark.asyncio
async def test_websocket_manager():
    mgr = ConnectionManager()
    mock_ws = MagicMock()
    mock_ws.accept = AsyncMock()
    mock_ws.send_json = AsyncMock()

    # 1. Connect
    await mgr.connect(mock_ws, "case_1")
    assert "case_1" in mgr.active_connections
    assert len(mgr.active_connections["case_1"]) == 1

    # 2. Broadcast
    await mgr.broadcast_to_case("case_1", {"type": "ping"})
    mock_ws.send_json.assert_called_once_with({"type": "ping"})

    # 3. Disconnect
    mgr.disconnect(mock_ws, "case_1")
    assert "case_1" not in mgr.active_connections


def test_stream_cdr_endpoint(client, mock_db_session):
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_case = Case(id="case_123", title="Op Storm", investigators=[head_user])

    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user, mock_case
    ]

    with patch("confluent_kafka.Producer") as mock_kafka:
        mock_p = MagicMock()
        mock_kafka.return_value = mock_p

        payload = {
            "case_id": "case_123",
            "caller": "+919820199482",
            "receiver": "+919821048192",
            "timestamp": "2026-09-02 10:00:00",
            "duration_seconds": 120,
            "cell_tower_id": "TOWER-1"
        }
        res = client.post("/api/v1/evidence/stream", headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert res.status_code == status.HTTP_202_ACCEPTED
        assert res.json()["status"] == "accepted"


def test_tasks_error_handling_and_empty_files(tmp_path):
    # 1. Missing file
    with pytest.raises(ValueError):
        extract_entities_task.run("ev_none", "/nonexistent/path/fir.txt", "case_1")

    # 2. Empty file
    empty_file = tmp_path / "empty.txt"
    empty_file.write_text("   ", encoding="utf-8")
    with patch("workers.tasks._update_evidence_status") as mock_update:
        res = extract_entities_task.run("ev_empty", str(empty_file), "case_1")
        assert res["status"] == "skipped"
        mock_update.assert_called_with("ev_empty", "FAILED", "Empty file — nothing to extract")

    # 3. Missing CSV
    with pytest.raises(ValueError):
        process_structured_data_task.run("ev_none_csv", "CDR", "/nonexistent/path.csv", "case_1")


def test_base_task_callbacks():
    class TestTask(CrimenetBaseTask):
        name = "test_task"

    task = TestTask()
    
    with patch.object(CrimenetBaseTask, "request", create=True) as mock_req:
        mock_req.retries = 1
        # on_retry
        task.on_retry(Exception("Transient error"), "task_1", ["ev_1"], {}, None)

        # on_success
        task.on_success({"status": "ok"}, "task_1", ["ev_1"], {})


def test_review_queue_job_states(client, mock_db_session):
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = head_user

    with patch("api.routers.review_queue.AsyncResult") as mock_async:
        # Failure state
        mock_res_fail = MagicMock(state="FAILURE", result=Exception("Task crashed"))
        mock_async.return_value = mock_res_fail
        res = client.get("/api/v1/jobs/job_fail", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["status"] == "FAILURE"

        # Retry state
        mock_res_retry = MagicMock(state="RETRY", info={"retries": 2})
        mock_async.return_value = mock_res_retry
        res = client.get("/api/v1/jobs/job_retry", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["retries"] == 2


def test_cases_router_not_found_branches(client, mock_db_session):
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user, None, # get_case 404
        head_user, None, # close_case 404
        head_user, None, # delete_case 404
    ]

    res1 = client.get("/api/v1/cases/case_none", headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == status.HTTP_404_NOT_FOUND

    res2 = client.patch("/api/v1/cases/case_none/close", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == status.HTTP_404_NOT_FOUND

    res3 = client.delete("/api/v1/cases/case_none", headers={"Authorization": f"Bearer {token}"})
    assert res3.status_code == status.HTTP_404_NOT_FOUND
