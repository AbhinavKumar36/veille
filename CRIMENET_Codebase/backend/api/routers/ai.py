"""
VEILLE — AI Intelligence Assistant Router
Uses Gemini Flash / LLM engine with dynamic RAG context injected from Neo4j
to perform investigative intelligence synthesis over case evidence.
"""
import os
import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.auth import get_current_user
from core.config import settings
from core.database import get_db
from core.graph_db import get_graph_session
from db.models import Case, Evidence

logger = logging.getLogger("veille.ai")
router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    case_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


class EntityCitation(BaseModel):
    name: str
    type: str
    confidence: str
    citation: str


class ChatResponse(BaseModel):
    response: str
    entities: List[EntityCitation] = []
    citations: List[dict] = []


VEILLE_AI_SYSTEM_PROMPT = """You are VEILLE AI, an advanced Intelligence Analyst and Relationship Fusion Assistant for law enforcement and strategic intelligence operations.
Your job is to assist investigators by analyzing evidence, identifying suspicious financial or logistical patterns, mapping syndicate hierarchies, and providing tactical recommendations based on case data.

Key Guidelines:
1. Maintain a professional, clinical intelligence tone.
2. Emphasize verified facts, high-confidence links, and investigative leads.
3. Structure responses with clear headings (##), bullet points (•), and key findings.
4. When mentioning entities (suspects, phone numbers, accounts, locations, vehicles), explicitly state their relationship to the criminal network.
5. Always cite which evidence documents support each claim.
6. Never state an entity is guilty — only report investigative priority and analytical significance.
"""


def _fetch_graph_context(query: str, case_id: Optional[str] = None) -> dict:
    """
    Fetch relevant graph nodes from Neo4j based on query keywords.
    Injects real case intelligence into the AI prompt (RAG).
    """
    try:
        with get_graph_session() as session:
            if case_id:
                result = session.run(
                    """
                    MATCH (n)
                    WHERE n.case_id = $case_id
                    RETURN n.name AS name, labels(n)[0] AS type, properties(n) AS props
                    LIMIT 30
                    """,
                    case_id=case_id,
                )
            else:
                result = session.run(
                    """
                    MATCH (n)
                    RETURN n.name AS name, labels(n)[0] AS type, properties(n) AS props
                    LIMIT 30
                    """
                )

            nodes = []
            extracted_entities = []
            citations = []
            seen_citations = set()

            for record in result:
                if record["name"]:
                    props = dict(record["props"])
                    props.pop("case_id", None)
                    prop_str = ", ".join(f"{k}: {v}" for k, v in props.items() if k != "id" and v)
                    nodes.append(f"- [{record['type']}] {record['name']} ({prop_str})")
                    
                    evidence_id = props.get("source_evidence_id", "Graph DB")
                    extracted_entities.append(
                        EntityCitation(
                            name=record["name"],
                            type=record["type"].upper(),
                            confidence="High",
                            citation=evidence_id
                        )
                    )
                    
                    if evidence_id != "Graph DB" and evidence_id not in seen_citations:
                        seen_citations.add(evidence_id)
                        citations.append({
                            "id": evidence_id,
                            "title": f"Source Evidence {evidence_id}",
                            "confidence": "High"
                        })

            # Also fetch key relationships
            if case_id:
                rel_result = session.run(
                    """
                    MATCH (n)-[r]->(m)
                    WHERE n.case_id = $case_id AND m.case_id = $case_id
                    RETURN n.name AS source, type(r) AS rel, m.name AS target, r.confidence AS conf, r.source_evidence_id AS ev_id
                    LIMIT 20
                    """,
                    case_id=case_id,
                )
            else:
                rel_result = session.run(
                    """
                    MATCH (n)-[r]->(m)
                    RETURN n.name AS source, type(r) AS rel, m.name AS target, r.confidence AS conf, r.source_evidence_id AS ev_id
                    LIMIT 20
                    """
                )

            rels = []
            for record in rel_result:
                conf = f" (confidence: {record['conf']:.2f})" if record.get("conf") else ""
                rels.append(f"- {record['source']} --[{record['rel']}]--> {record['target']}{conf}")
                
                ev_id = record.get("ev_id")
                if ev_id and ev_id not in seen_citations:
                    seen_citations.add(ev_id)
                    citations.append({
                        "id": ev_id,
                        "title": f"Source Evidence {ev_id}",
                        "confidence": f"{record['conf']*100:.0f}%" if record.get("conf") else "High"
                    })

            context_parts = []
            if nodes:
                context_parts.append("### Known Entities in Case Graph:\n" + "\n".join(nodes))
            if rels:
                context_parts.append("### Known Relationships:\n" + "\n".join(rels))

            return {
                "context_text": "\n\n".join(context_parts) if context_parts else "",
                "entities": extracted_entities,
                "citations": citations
            }
    except Exception as e:
        logger.warning(f"Failed to fetch graph context for RAG: {e}")
        return {"context_text": "", "entities": [], "citations": []}


@router.post("/chat", response_model=ChatResponse)
@router.post("/query", response_model=ChatResponse)
async def chat_with_assistant(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Query the intelligence assistant with natural language.
    Injects real Neo4j graph data as RAG context before calling the LLM.
    """
    user_query = (body.message or body.query or "").strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    # ── RAG: Fetch live graph context from Neo4j ─────────────────────────────
    graph_data = _fetch_graph_context(user_query, body.case_id)
    graph_context = graph_data["context_text"]
    dynamic_entities = graph_data["entities"]
    dynamic_citations = graph_data["citations"]

    if graph_context:
        dynamic_prompt = f"""{VEILLE_AI_SYSTEM_PROMPT}

## Live Case Intelligence Context (from Knowledge Graph):
{graph_context}

Use this graph intelligence as your primary source of truth when answering the investigator's query.
"""
    else:
        dynamic_prompt = f"""{VEILLE_AI_SYSTEM_PROMPT}

## Active Case Intelligence:
No extracted entity relationships or graph records currently exist for this query scope. Please advise the investigator to ingest evidence (FIRs, CDRs, financials) to populate the knowledge graph.
"""

    ai_text_response = ""

    if api_key and not api_key.startswith("CHANGE_ME"):
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            prompt_content = f"{dynamic_prompt}\n\n## Investigator Query:\n{user_query}"

            model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt_content,
            )
            ai_text_response = resp.text
            ai_text_response += "\n\n*— Generated via Gemini AI Engine*"
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to standard intelligence response.")
            ai_text_response = _rule_based_fallback(user_query, graph_context)
    else:
        ai_text_response = _rule_based_fallback(user_query, graph_context)

    return ChatResponse(
        response=ai_text_response,
        entities=dynamic_entities,
        citations=dynamic_citations,
    )


def _rule_based_fallback(query: str, graph_context: str) -> str:
    """Returns an authentic intelligence response based on available graph data."""
    q = query.lower()
    
    if any(w in q for w in ["hey", "hi", "hello", "greetings"]):
        return "Hello Investigator. Ready to analyze case evidence and synthesize network intelligence. What would you like to investigate?"

    if graph_context:
        return (
            f"## Case Knowledge Analysis\n\n"
            f"Based on real-time graph intelligence in the active case file:\n\n"
            f"{graph_context}\n\n"
            f"## Analytical Lead\n\n"
            f"• Cross-reference suspect phone numbers with cell tower pings.\n"
            f"• Review linked transaction paths for offshore intermediary conduits."
        )

    return (
        "## Intelligence Assistant // Empty Slate Notice\n\n"
        "• No matching entities or transaction paths were identified in the knowledge graph for this query.\n"
        "• **Recommended Action**: Ingest raw FIR documents, wiretap audio, or CDR files into the Seized Evidence Vault to allow the NLP pipeline to extract entities and build relationship topologies."
    )
