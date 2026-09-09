import pytest
from unittest.mock import patch, MagicMock
import json
import os

from workers.tasks import extract_entities_task, process_structured_data_task, graph_analytics_task
from workers.base_task import CrimenetBaseTask
from ml.nlp.schemas import ExtractedGraph, ExtractedEntity, ExtractedRelation

def test_extract_entities_task_flow(tmp_path):
    test_file = tmp_path / "test_fir.txt"
    test_file.write_text("Vikram Mehta met Elena Rostova at Mumbai Port.", encoding="utf-8")

    mock_extracted = ExtractedGraph(
        entities=[
            ExtractedEntity(id="Person_Vikram", label="Person", name="Vikram Mehta"),
            ExtractedEntity(id="Person_Elena", label="Person", name="Elena Rostova"),
        ],
        relationships=[
            ExtractedRelation(source_id="Person_Vikram", target_id="Person_Elena", type="ASSOCIATED_WITH", confidence=0.9)
        ]
    )

    with patch("ml.nlp.extractor.EvidenceExtractor.extract", return_value=mock_extracted), \
         patch("ml.entity_resolution.resolver.EntityResolver.resolve_extracted_graph", return_value={"entities": [], "relationships": [], "auto_merged": 0, "queued_for_review": 0}), \
         patch("services.graph_service.insert_extracted_graph") as mock_insert, \
         patch("workers.tasks._update_evidence_status") as mock_update, \
         patch("core.database.SessionLocal"):

        result = extract_entities_task.run("ev_123", str(test_file), "case_123")
        assert result["status"] == "success"
        assert result["entities_extracted"] == 2
        mock_update.assert_called_with("ev_123", "COMPLETED")


def test_process_structured_data_task_cdr(tmp_path):
    test_csv = tmp_path / "cdr.csv"
    test_csv.write_text(
        "caller,receiver,timestamp,duration_seconds,cell_tower_id\n"
        "+919820199482,+919821048192,2026-09-02 10:00:00,120,TOWER-1\n",
        encoding="utf-8"
    )

    with patch("services.graph_service.insert_extracted_graph") as mock_insert, \
         patch("workers.tasks._update_evidence_status") as mock_update, \
         patch("core.database.SessionLocal"):

        result = process_structured_data_task.run("ev_456", "CDR", str(test_csv), "case_123")
        assert result["status"] == "success"
        assert result["rows_parsed"] == 1
        assert result["entities_created"] == 2
        assert result["relationships_created"] == 1
        mock_update.assert_called_with("ev_456", "COMPLETED")


def test_process_structured_data_task_financial(tmp_path):
    test_csv = tmp_path / "fin.csv"
    test_csv.write_text(
        "sender_account,receiver_account,amount,timestamp,reference\n"
        "ACC-101,ACC-202,500000,2026-09-02 11:00:00,TXN-999\n",
        encoding="utf-8"
    )

    with patch("services.graph_service.insert_extracted_graph") as mock_insert, \
         patch("workers.tasks._update_evidence_status") as mock_update, \
         patch("core.database.SessionLocal"):

        result = process_structured_data_task.run("ev_789", "FINANCIAL", str(test_csv), "case_123")
        assert result["status"] == "success"
        assert result["rows_parsed"] == 1
        assert result["entities_created"] == 2
        assert result["relationships_created"] == 1


def test_graph_analytics_task():
    with patch("core.graph_db.get_graph_session") as mock_get_graph:
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_session.run.return_value.single.return_value = {"updated_nodes": 15}

        result = graph_analytics_task.run("case_123")
        assert result["status"] == "success"
        assert result["nodes_updated"] == 15


def test_base_task_on_failure_dlq():
    task_instance = CrimenetBaseTask()
    task_instance.name = "extract_entities"

    with patch("workers.base_task._get_redis_client") as mock_redis, \
         patch("workers.base_task._update_evidence_status") as mock_update:
        
        mock_r = MagicMock()
        mock_redis.return_value = mock_r

        task_instance.on_failure(
            exc=Exception("Fatal extraction error"),
            task_id="task_fail_1",
            args=["ev_123", "/path/to/file", "case_1"],
            kwargs={},
            einfo=None
        )

        mock_update.assert_called_once()
        mock_r.lpush.assert_called_once()
