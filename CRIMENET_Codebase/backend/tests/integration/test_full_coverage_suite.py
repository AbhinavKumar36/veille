import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from io import BytesIO
import json
import uuid
import os
from datetime import datetime, timezone

from db.models import User, Case, Evidence, OutboxEvent
from api.auth import create_access_token
from services.graph_service import insert_extracted_graph
from ml.nlp.schemas import ExtractedGraph, ExtractedEntity, ExtractedRelation


def test_case_stats(client, mock_db_session):
    case_uuid = str(uuid.uuid4())
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_case = Case(id=case_uuid, title="Op Storm", investigators=[head_user], created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))

    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user, mock_case
    ]
    mock_db_session.query.return_value.filter.return_value.count.return_value = 4

    with patch("api.routers.cases.get_graph_session") as mock_get_graph:
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_session.run.return_value.single.return_value = {"nodes": 10, "edges": 15}

        res = client.get(f"/api/v1/cases/{case_uuid}/stats", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["node_count"] == 10
        assert res.json()["evidence_count"] == 4


def test_add_investigator_to_case(client, mock_db_session):
    case_uuid = str(uuid.uuid4())
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    inv_user = User(id="inv_2", email="inv2@example.com", role="INVESTIGATOR", is_active=True)
    mock_case = Case(id=case_uuid, title="Op Storm", investigators=[head_user], created_at=datetime.now(timezone.utc))

    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user, mock_case, inv_user, head_user
    ]

    res = client.post(f"/api/v1/cases/{case_uuid}/investigators/inv_2", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    assert "added to case" in res.json()["message"]


def test_ingestion_get_all_and_download_and_stream(client, mock_db_session, tmp_path):
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    
    dummy_file = tmp_path / "download_test.pdf"
    dummy_file.write_bytes(b"%PDF-1.4 dummy evidence")

    ev_id = str(uuid.uuid4())
    mock_ev = Evidence(
        id=ev_id,
        case_id="case_1",
        source_type="FIR",
        original_filename="download_test.pdf",
        file_path=str(dummy_file),
        status="COMPLETED"
    )

    mock_db_session.query.return_value.filter.return_value.first.return_value = head_user
    mock_db_session.query.return_value.offset.return_value.limit.return_value.all.return_value = [mock_ev]

    # 1. Get all evidence
    res = client.get("/api/v1/evidence/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    assert len(res.json()) == 1

    # 2. Download file
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user, mock_ev, head_user
    ]
    res = client.get(f"/api/v1/evidence/file/{ev_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    assert res.content == b"%PDF-1.4 dummy evidence"


def test_users_delete(client, mock_db_session):
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    target_user = User(id="target_id", email="target@example.com", role="INVESTIGATOR", is_active=True)

    # 1. Delete target user
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        head_user, target_user, head_user
    ]
    res = client.delete("/api/v1/users/target_id", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_204_NO_CONTENT

    # 2. Self-delete error
    mock_db_session.query.return_value.filter.return_value.first.return_value = head_user
    res = client.delete("/api/v1/users/head_1", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_400_BAD_REQUEST


def test_review_queue_job_status_and_retry_dlq(client, mock_db_session):
    token = create_access_token("head_1", "head@example.com", "HEAD")
    head_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = head_user

    # 1. Job status polling
    with patch("api.routers.review_queue.AsyncResult") as mock_async_result:
        mock_res = MagicMock()
        mock_res.state = "SUCCESS"
        mock_res.result = {"status": "ok"}
        mock_async_result.return_value = mock_res

        res = client.get("/api/v1/jobs/job_123", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["status"] == "SUCCESS"

    # 2. Retry DLQ job
    mock_dlq_item = {
        "task_id": "dlq_task_1",
        "task_name": "extract_entities",
        "evidence_id": "ev_1",
        "kwargs": "{}"
    }
    with patch("api.routers.review_queue.get_redis") as mock_get_redis, \
         patch("workers.tasks.extract_entities_task.delay") as mock_delay:
        
        mock_r = MagicMock()
        mock_get_redis.return_value = mock_r
        mock_r.lrange.return_value = [json.dumps(mock_dlq_item)]
        mock_delay.return_value = MagicMock(id="new_job_777")

        res = client.post("/api/v1/admin/dlq/dlq_task_1/retry", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["status"] == "requeued"


def test_geospatial_stats_and_global_query(client, mock_db_session):
    token = create_access_token("inv_1", "inv@example.com", "INVESTIGATOR")
    mock_user = User(id="inv_1", email="inv@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    with patch("api.routers.geospatial.get_graph_session") as mock_get_graph:
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session

        # 1. Stats
        mock_session.run.return_value.single.return_value = {"total_locations": 42}
        res = client.get("/api/v1/geospatial/stats", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["total_locations"] == 42

        # 2. Global locations query without case_id
        mock_record = {
            "id": "loc-2", "name": "Bandra Kurla Complex",
            "lat": 19.0657, "lng": 72.8685, "type": "HQ", "timestamp": "", "details": ""
        }
        mock_session.run.return_value = [mock_record]
        res = client.get("/api/v1/geospatial/", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert len(res.json()) == 1


def test_services_insert_extracted_graph(mock_db_session):
    graph = ExtractedGraph(
        entities=[
            ExtractedEntity(id="Person_A", label="Person", name="Agent A", properties={"rank": "Captain"}),
            ExtractedEntity(id="Person_B", label="Person", name="Agent B", properties={"rank": "Sergeant"}),
        ],
        relationships=[
            ExtractedRelation(source_id="Person_A", target_id="Person_B", type="COMMUNICATES_WITH", confidence=0.88, properties={})
        ]
    )

    insert_extracted_graph(mock_db_session, graph, source_evidence_id="ev_999", case_id="case_1")
    # Should create 2 NODE_UPSERT and 1 EDGE_CREATE outbox events
    assert mock_db_session.add.call_count == 3
