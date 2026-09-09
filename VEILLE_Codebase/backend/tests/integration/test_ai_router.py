import pytest
from unittest.mock import patch, MagicMock
from fastapi import status

def test_chat_with_assistant_empty_message(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User

    token = create_access_token("user_1", "user@example.com", "INVESTIGATOR")
    mock_user = User(id="user_1", email="user@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    response = client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "   "}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_chat_with_assistant_success_gemini(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User

    token = create_access_token("user_1", "user@example.com", "INVESTIGATOR")
    mock_user = User(id="user_1", email="user@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    mock_node_record = {
        "name": "Vikram Mehta",
        "type": "Person",
        "props": {"role": "Kingpin", "source_evidence_id": "ev_123"}
    }
    mock_rel_record = {
        "source": "Vikram Mehta",
        "rel": "CONTROLS",
        "target": "Zenith Maritime",
        "conf": 0.95,
        "ev_id": "ev_123"
    }

    with patch("api.routers.ai.get_graph_session") as mock_get_graph, \
         patch("google.genai.Client") as mock_genai_client:

        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_session.run.side_effect = [
            [mock_node_record],
            [mock_rel_record]
        ]

        mock_instance = MagicMock()
        mock_genai_client.return_value = mock_instance
        mock_model_resp = MagicMock()
        mock_model_resp.text = "Vikram Mehta is confirmed as the key coordinator."
        mock_instance.models.generate_content.return_value = mock_model_resp

        response = client.post(
            "/api/v1/ai/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "Synthesize intelligence on Vikram Mehta", "case_id": "case_1"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "Vikram Mehta" in data["response"]
        assert len(data["entities"]) == 1
        assert len(data["citations"]) == 1


def test_chat_with_assistant_fallback_and_greetings(client, mock_db_session):
    from api.auth import create_access_token
    from db.models import User

    token = create_access_token("user_1", "user@example.com", "INVESTIGATOR")
    mock_user = User(id="user_1", email="user@example.com", role="INVESTIGATOR", is_active=True)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    # 1. Greetings
    with patch("api.routers.ai.get_graph_session") as mock_get_graph, \
         patch("api.routers.ai.settings.GEMINI_API_KEY", ""):
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_session.run.side_effect = [[], []]

        response = client.post(
            "/api/v1/ai/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "Hello AI Assistant"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "Hello Investigator" in response.json()["response"]

    # 2. Empty graph fallback
    with patch("api.routers.ai.get_graph_session") as mock_get_graph, \
         patch("api.routers.ai.settings.GEMINI_API_KEY", ""):
        mock_session = MagicMock()
        mock_get_graph.return_value.__enter__.return_value = mock_session
        mock_session.run.side_effect = [[], []]

        response = client.post(
            "/api/v1/ai/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "Analyze network topology"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "Empty Slate Notice" in response.json()["response"]
