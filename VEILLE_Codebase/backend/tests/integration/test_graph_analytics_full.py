import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
import uuid

def test_graph_analytics_algorithms(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User, Case

    case_uuid = str(uuid.uuid4())
    token = create_access_token("head_1", "head@example.com", "HEAD")
    mock_user = User(id="head_1", email="head@example.com", role="HEAD", is_active=True)
    mock_case = Case(id=case_uuid, title="Operation Storm", investigators=[mock_user])

    def mock_query(model):
        m = MagicMock()
        if model == User:
            m.filter.return_value.first.return_value = mock_user
        elif model == Case:
            m.filter.return_value.first.return_value = mock_case
        else:
            m.filter.return_value.first.return_value = mock_user
        return m

    mock_db_session.query.side_effect = mock_query

    with patch("api.routers.graph.get_graph_session") as mock_get_graph, \
         patch("api.routers.graph.cache_get", return_value=None), \
         patch("api.routers.graph.cache_set"):

        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session

        # 1. PageRank
        mock_session.run.return_value = [{"id": "n1", "name": "Node 1", "type": "Person", "score": 0.88}]
        res = client.get(f"/api/v1/graph/{case_uuid}/analytics?algorithm=pagerank", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["algorithm"] == "pagerank"

        # 2. Louvain
        mock_session.run.return_value = [{"id": "n1", "name": "Node 1", "type": "Person", "score": 1}]
        res = client.get(f"/api/v1/graph/{case_uuid}/analytics?algorithm=louvain", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["algorithm"] == "louvain"

        # 3. Temporal
        mock_session.run.return_value = [{
            "source": "n1", "source_name": "Node 1", "target": "n2", "target_name": "Node 2",
            "event_type": "CALLED", "timestamp": "2026-09-02 10:00:00"
        }]
        res = client.get(f"/api/v1/graph/{case_uuid}/analytics?algorithm=temporal", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["algorithm"] == "temporal"

        # 4. Degree
        mock_session.run.return_value = [{"id": "n1", "name": "Node 1", "type": "Person", "score": 5}]
        res = client.get(f"/api/v1/graph/{case_uuid}/analytics?algorithm=degree", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["algorithm"] == "degree"
