import pytest
from unittest.mock import patch, MagicMock
from fastapi import status

from core.redis_client import cache_get, cache_set, get_redis_client
from core.graph_db import GraphDB, get_graph_session
from core.database import get_db, SessionLocal
from core.telemetry import setup_telemetry

def test_redis_client_cache_operations():
    with patch("core.redis_client.get_redis_client") as mock_get_r:
        mock_r = MagicMock()
        mock_get_r.return_value = mock_r
        
        mock_r.get.return_value = '{"foo": "bar"}'
        val = cache_get("test_key")
        assert val == {"foo": "bar"}

        cache_set("test_key", {"foo": "bar"}, expire_seconds=60)
        mock_r.setex.assert_called_once()


def test_graph_db_singleton():
    with patch("neo4j.GraphDatabase.driver") as mock_driver:
        g = GraphDB()
        assert g.verify_connectivity() == True
        g.close()
        mock_driver.return_value.close.assert_called_once()


def test_telemetry_setup():
    app_mock = MagicMock()
    setup_telemetry(app_mock)
