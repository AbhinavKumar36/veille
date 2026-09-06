import pytest
from unittest.mock import patch, MagicMock

from ml.nlp.extractor import EvidenceExtractor, GeminiAPIError, ExtractionValidationError
from ml.nlp.schemas import ExtractedGraph


@pytest.fixture
def extractor(mock_genai_client):
    return EvidenceExtractor()


@pytest.fixture
def mock_genai_client():
    with patch("google.genai.Client") as mock_client:
        yield mock_client


def test_extractor_success(extractor, mock_genai_client):
    # Mock the Gemini API call to return valid JSON
    mock_response = MagicMock()
    mock_response.text = '''
    {
        "entities": [
            {"id": "person_1", "label": "Person", "name": "John Doe", "properties": {"age": "30"}}
        ],
        "relationships": [
            {"source_id": "person_1", "target_id": "phone_1", "type": "OWNS", "confidence": 0.9, "properties": {}}
        ]
    }
    '''
    
    mock_client_instance = mock_genai_client.return_value
    mock_client_instance.models.generate_content.return_value = mock_response
    
    result = extractor.extract("John Doe owns a phone.", "test.txt")
        
    assert isinstance(result, ExtractedGraph)
    assert len(result.entities) == 1
    assert result.entities[0].name == "John Doe"
    assert len(result.relationships) == 1
    assert result.relationships[0].type == "OWNS"


def test_extractor_api_error(extractor, mock_genai_client):
    mock_client_instance = mock_genai_client.return_value
    mock_client_instance.models.generate_content.side_effect = Exception("API down")
    
    with pytest.raises(GeminiAPIError):
        extractor._extract_with_retry("text")


def test_extractor_validation_error_after_retries(extractor, mock_genai_client):
    mock_response = MagicMock()
    mock_response.text = '{"bad_key": "not a graph"}'
    
    mock_client_instance = mock_genai_client.return_value
    mock_client_instance.models.generate_content.return_value = mock_response
    
    with pytest.raises(Exception):
        extractor._extract_with_retry("text")
