# 04 NLP SPECIFICATION

**Status:** IMPLEMENTATION READY
**Component:** Intelligence Engine

This specification dictates the structure and constraints of the LLM prompts used to extract entities and relationships from unstructured text (FIRs). 

## 1. The Strategy: Constrained Generation

Large Language Models (LLMs) are prone to hallucinating arbitrary graph structures (e.g., creating a node type `Suspect` when we only allow `Person`). To prevent graph corruption, we enforce **Constrained Generation** using strict JSON Schemas mapped to Pydantic models.

## 2. The System Prompt

The NLP Engine must wrap every raw FIR document in the following strict system prompt before sending it to the model (Gemini/Claude):

```text
You are an expert Intelligence Analyst for VEILLE.
Your task is to perform Named Entity Recognition (NER) and Relationship Extraction on the provided unstructured text.

STRICT CONSTRAINTS:
1. You may ONLY extract entities of the following types: [Person, Phone, Account, Vehicle, Organization, Location, Event].
2. You may ONLY extract relationships of the following types: [ASSOCIATED_WITH, OWNS, COMMUNICATES_WITH, LOCATED_AT, PARTICIPATED_IN].
3. You must output the result strictly matching the provided JSON schema. Do not include markdown formatting or conversational text.
4. If an entity is ambiguous, do not invent details. Leave optional fields null.
5. All IDs must be unique strings formatted as {type}_{name_hash} to allow for downstream entity resolution.
```

## 3. Pydantic Enforcement

The output from the LLM is piped directly into `ml.nlp.schemas.ExtractedGraph`. 
If a `ValidationError` occurs (e.g., the LLM output `type: Suspect`), the system automatically throws the error back to the LLM for a retry with the exact error message. If it fails 3 times, the document is sent to the Redis Dead Letter Queue for human review.

## 4. Output Example

```json
{
  "entities": [
    {
      "id": "Person_Rajesh",
      "label": "Person",
      "name": "Rajesh Kumar",
      "properties": {"age": 45}
    },
    {
      "id": "Vehicle_MH04",
      "label": "Vehicle",
      "name": "Toyota Innova",
      "properties": {"plate": "MH04-1234"}
    }
  ],
  "relationships": [
    {
      "source_id": "Person_Rajesh",
      "target_id": "Vehicle_MH04",
      "type": "OWNS",
      "confidence": 0.95
    }
  ]
}
```
