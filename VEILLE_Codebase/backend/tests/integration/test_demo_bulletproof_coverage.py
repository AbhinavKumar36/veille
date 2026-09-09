import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI, Request
import json
import uuid

from api.main import app, lifespan, global_exception_handler, value_error_handler
from core.database import get_db
from core.graph_db import GraphDB, get_graph_session
from core.telemetry import setup_telemetry
from core.redis_client import get_redis_client, cache_get, cache_set


@pytest.mark.asyncio
async def test_lifespan_startup_and_shutdown():
    test_app = FastAPI()
    with patch("core.graph_db.graph_db.verify_connectivity", return_value=True), \
         patch("db.models.Base.metadata.create_all") as mock_create_all, \
         patch("core.config.settings.APP_ENV", "development"):
        async with lifespan(test_app):
            mock_create_all.assert_called_once()


def test_main_root_and_health(client: TestClient):
    # 1. Root
    resp = client.get("/")
    assert resp.status_code == 200
    assert "VEILLE API Gateway" in resp.json()["status"]

    # 2. Health check with all connected
    with patch("core.graph_db.graph_db.verify_connectivity", return_value=True), \
         patch("workers.celery_app.celery_app.control.ping", return_value=[{"celery@node": {"ok": "pong"}}]):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
        assert resp.json()["neo4j"] == "connected"
        assert resp.json()["celery"] == "connected"

    # 3. Health check with disconnected services
    with patch("core.graph_db.graph_db.verify_connectivity", return_value=False), \
         patch("workers.celery_app.celery_app.control.ping", side_effect=Exception("Celery down")):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["neo4j"] == "disconnected"
        assert resp.json()["celery"] == "disconnected"


@pytest.mark.asyncio
async def test_global_exception_handlers():
    mock_request = MagicMock(spec=Request)
    mock_request.url.path = "/test-error"
    mock_request.method = "GET"

    # 1. Generic Exception -> 500
    resp_500 = await global_exception_handler(mock_request, Exception("Crash"))
    assert resp_500.status_code == 500

    # 2. ValueError -> 400
    resp_400 = await value_error_handler(mock_request, ValueError("Invalid field"))
    assert resp_400.status_code == 400


def test_core_database_generator():
    gen = get_db()
    db_session = next(gen)
    assert db_session is not None
    with pytest.raises(StopIteration):
        next(gen)


def test_core_graph_db_wrapper():
    with patch("neo4j.GraphDatabase.driver") as mock_driver_cls:
        mock_driver = MagicMock()
        mock_driver_cls.return_value = mock_driver

        gdb = GraphDB()
        
        # get_session
        gdb.get_session()
        mock_driver.session.assert_called_once()

        # verify_connectivity success
        mock_driver.verify_connectivity.return_value = None
        assert gdb.verify_connectivity() is True

        # verify_connectivity failure
        mock_driver.verify_connectivity.side_effect = Exception("Neo4j down")
        assert gdb.verify_connectivity() is False

        # close
        gdb.close()
        mock_driver.close.assert_called_once()


def test_core_telemetry_enabled():
    with patch("core.config.settings.OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"), \
         patch("core.telemetry.BatchSpanProcessor") as mock_bsp, \
         patch("core.telemetry.OTLPSpanExporter") as mock_exporter, \
         patch("core.telemetry.TracerProvider") as mock_tp, \
         patch("core.telemetry.trace.set_tracer_provider"), \
         patch("core.telemetry.FastAPIInstrumentor.instrument_app"), \
         patch("core.telemetry.SQLAlchemyInstrumentor.instrument"), \
         patch("core.telemetry.RedisInstrumentor.instrument"), \
         patch("core.telemetry.CeleryInstrumentor.instrument"):
        mock_provider_instance = MagicMock()
        mock_tp.return_value = mock_provider_instance
        setup_telemetry(app=MagicMock(), is_celery=True)
        mock_provider_instance.add_span_processor.assert_called_once()


def test_core_get_graph_session_context():
    with patch("core.graph_db.graph_db.get_session") as mock_get_sess:
        mock_session = MagicMock()
        mock_get_sess.return_value = mock_session
        with get_graph_session() as sess:
            assert sess == mock_session
        mock_session.close.assert_called_once()


def test_redis_client_caching():
    with patch("core.redis_client.get_redis_client") as mock_get_client:
        mock_redis = MagicMock()
        mock_get_client.return_value = mock_redis

        # Set
        cache_set("key1", {"foo": "bar"}, expire_seconds=60)
        mock_redis.setex.assert_called_once_with("key1", 60, json.dumps({"foo": "bar"}))

        # Get valid
        mock_redis.get.return_value = json.dumps({"foo": "bar"})
        val = cache_get("key1")
        assert val == {"foo": "bar"}

        # Get corrupt
        mock_redis.get.return_value = "invalid_json{"
        val_bad = cache_get("key1")
        assert val_bad is None

        # Get none
        mock_redis.get.return_value = None
        assert cache_get("nonexistent") is None


