import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from api.main import app
from core.database import get_db

@pytest.fixture
def mock_db_session():
    mock_db = MagicMock()
    yield mock_db

@pytest.fixture(autouse=True)
def mock_neo4j_connectivity():
    from unittest.mock import patch
    with patch("core.graph_db.graph_db.verify_connectivity", return_value=True):
        yield

@pytest.fixture
def client(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    
    with TestClient(app) as c:
        yield c
        
    app.dependency_overrides.clear()
