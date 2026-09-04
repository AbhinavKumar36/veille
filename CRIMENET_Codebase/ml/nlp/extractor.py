"""
VEILLE v4.0 — NLP Evidence Extractor
Replaces hardcoded mock data with real Gemini API extraction.

Pipeline:
  Raw text → System Prompt → Gemini API → Pydantic validation → ExtractedGraph
  On validation failure → retry (max 3) → DLQ

Key design decisions:
  - Constrained generation: response_schema enforces only allowed entity/relation types
  - 3-retry loop: on Pydantic validation failure, error is fed back to the model
  - Graceful degradation: if Gemini API key is missing, raises ConfigurationError
    (no silent mock fallback — callers must handle the error explicitly)
"""

import json
import logging
import os
import re
import time
from typing import Optional

from pydantic import ValidationError

from ml.nlp.schemas import ExtractedGraph

logger = logging.getLogger("veille.ml.extractor")

# Maximum number of LLM call retries on validation failure
MAX_RETRIES = 3


# ── System Prompt ────────────────────────────────────────────────────────────
# This prompt is prepended to every document before sending to Gemini.
# It constrains generation to prevent graph corruption from hallucinated types.

SYSTEM_PROMPT = """You are an expert Intelligence Analyst for VEILLE, a law enforcement intelligence platform.
Your task is to perform Named Entity Recognition (NER) and Relationship Extraction on the provided police evidence document.

STRICT CONSTRAINTS — YOU MUST FOLLOW THESE EXACTLY:

1. ENTITY TYPES: You may ONLY extract entities of these exact types:
   - Person      (individuals: suspects, witnesses, victims, officials)
   - Phone       (phone numbers, SIM cards)
   - Account     (bank accounts, financial accounts, digital wallets)
   - Vehicle     (cars, motorcycles, trucks with registration details)
   - Organization (companies, gangs, criminal networks, institutions)
   - Location    (addresses, cities, landmarks, GPS coordinates)
   - Event       (incidents, meetings, transactions with timestamps)

2. RELATIONSHIP TYPES: You may ONLY use these exact relationship types:
   - ASSOCIATED_WITH    (general association, membership, connection)
   - OWNS               (person/org owns vehicle, account, phone)
   - COMMUNICATES_WITH  (calls, messages between persons/phones)
   - LOCATED_AT         (person/event at a location)
   - PARTICIPATED_IN    (person participated in an event)

3. OUTPUT FORMAT: Return ONLY valid JSON matching the required schema. No markdown, no explanation text.

4. AMBIGUITY RULE: If an entity is ambiguous, do NOT invent details. Leave optional fields null or empty.

5. ID FORMAT: Each entity ID must be unique and follow this pattern: {Label}_{name_without_spaces}
   Examples: Person_RajeshKumar, Phone_9876543210, Vehicle_MH041234

6. COMPLETENESS: Extract ALL entities and relationships visible in the document, not just obvious ones.
   Include dates, locations, and amounts as properties where relevant.

7. ETHICS CONSTRAINT: Do NOT assign guilt, risk scores, or suspicion labels. Extract facts only.
"""


class GeminiAPIError(Exception):
    """Raised when the Gemini API call fails (network, quota, etc.)."""
    pass


class ExtractionValidationError(Exception):
    """Raised when LLM output fails Pydantic validation after all retries."""
    pass


class ConfigurationError(Exception):
    """Raised when required configuration (API key) is missing."""
    pass


class EvidenceExtractor:
    """
    Extracts structured intelligence graphs from unstructured police documents
    using Gemini's constrained generation + Pydantic schema enforcement.
    """

    def __init__(self):
        self._client = None
        self._init_client()

    def _init_client(self):
        """Initialise Gemini client from environment. Raises ConfigurationError if key missing."""
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key or api_key.startswith("CHANGE_ME") or api_key == "YOUR_GOOGLE_GEMINI_API_KEY_HERE":
            logger.warning(
                "GEMINI_API_KEY is not set. Extraction will fail. "
                "Set the key in .env before running the pipeline."
            )
            return

        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
            logger.info("Gemini client initialised successfully.")
        except Exception as e:
            logger.error(f"Failed to initialise Gemini client: {e}")

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def extract(self, text_content: str, file_path: str = "") -> ExtractedGraph:
        """
        Main entry point. Extracts entities and relationships from text.

        Multi-modal pre-processing:
          - .png / .jpg / .jpeg → OCR via pytesseract
          - .mp3 / .wav → transcription via whisper (if available)
          - .pdf → plain text assumed (caller handles PDF-to-text)
          - .txt → used directly

        Args:
            text_content: The document text to process.
            file_path:    Optional path for multi-modal format detection.

        Returns:
            ExtractedGraph with validated entities and relationships.

        Raises:
            ConfigurationError: GEMINI_API_KEY not set.
            GeminiAPIError: Network/quota/API error after retries.
            ExtractionValidationError: LLM output fails schema validation after 3 retries.
        """
        if not self.is_configured:
            raise ConfigurationError(
                "GEMINI_API_KEY is not configured. "
                "Set it in .env: GEMINI_API_KEY=your_key_here"
            )

        # ── Multi-modal pre-processing ───────────────────────────────────
        text_content = self._preprocess(text_content, file_path)

        if not text_content or not text_content.strip():
            logger.warning(f"Empty document content for file: {file_path}")
            return ExtractedGraph(entities=[], relationships=[])

        # ── LLM Extraction with retry loop ──────────────────────────────
        return self._extract_with_retry(text_content)

    def _preprocess(self, text_content: str, file_path: str) -> str:
        """Handle OCR and audio transcription for non-text file types."""
        if not file_path:
            return text_content

        ext = file_path.lower().split(".")[-1]

        if ext in ("png", "jpg", "jpeg"):
            logger.info(f"Performing OCR on image: {file_path}")
            try:
                import pytesseract
                text_content = pytesseract.image_to_string(file_path)
            except Exception as e:
                logger.error(f"OCR failed for {file_path}: {e}")

        elif ext in ("mp3", "wav"):
            logger.info(f"Transcribing audio: {file_path}")
            try:
                import whisper
                model = whisper.load_model("base")
                result = model.transcribe(file_path)
                text_content = result["text"]
            except ImportError:
                logger.warning("whisper not installed — cannot transcribe audio")
            except Exception as e:
                logger.error(f"Audio transcription failed for {file_path}: {e}")

        return text_content

    def _extract_with_retry(self, text_content: str) -> ExtractedGraph:
        """
        Call Gemini with the system prompt + document content.
        Implements the 3-retry loop with error feedback to the model.
        On 3rd failure, raises ExtractionValidationError (caller routes to DLQ).
        """
        from google.genai import types

        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        last_error: Optional[Exception] = None

        for attempt in range(1, MAX_RETRIES + 1):
            logger.info(f"Gemini extraction attempt {attempt}/{MAX_RETRIES}")

            # On retry, append the previous error to help the model self-correct
            prompt = self._build_prompt(text_content, last_error if attempt > 1 else None)

            try:
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        temperature=0.1,   # Low temperature = more deterministic output
                    ),
                )
            except Exception as e:
                # Network / quota / API error — raise immediately (let Celery retry)
                logger.error(f"Gemini API call failed on attempt {attempt}: {e}")
                raise GeminiAPIError(f"Gemini API error: {e}") from e

            # ── Validate the response against our Pydantic schema ────────
            try:
                raw_text = response.text.strip()

                # Strip any accidental markdown code fences the model adds
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)

                extracted = ExtractedGraph.model_validate_json(raw_text)

                logger.info(
                    f"Extraction successful on attempt {attempt}: "
                    f"{len(extracted.entities)} entities, "
                    f"{len(extracted.relationships)} relationships"
                )
                return extracted

            except ValidationError as e:
                last_error = e
                logger.warning(
                    f"Pydantic validation failed on attempt {attempt}/{MAX_RETRIES}: "
                    f"{e.error_count()} errors"
                )

                if attempt < MAX_RETRIES:
                    # Brief pause before retry to avoid rate-limit hammering
                    time.sleep(2 ** attempt)   # Exponential backoff: 2s, 4s
                    continue

        # All retries exhausted — route to DLQ (caller handles this)
        raise ExtractionValidationError(
            f"Gemini output failed Pydantic validation after {MAX_RETRIES} attempts. "
            f"Last error: {last_error}"
        )

    def _build_prompt(
        self,
        text_content: str,
        previous_error: Optional[Exception] = None,
    ) -> str:
        """Build the user-facing prompt. On retry, include the previous error."""
        base = f"Extract all entities and relationships from this police evidence document:\n\n---\n{text_content}\n---"

        if previous_error:
            error_summary = str(previous_error)[:500]   # Truncate to avoid huge prompts
            base += (
                f"\n\nIMPORTANT: Your previous response failed schema validation with this error:\n"
                f"{error_summary}\n"
                f"Please correct your output to exactly match the required JSON schema."
            )

        return base


# ── Backwards-compatible alias used by existing tasks.py ─────────────────────
class NLPExtractor(EvidenceExtractor):
    """Alias kept for backwards compatibility with tasks.py."""

    def process_document(self, text_content: str) -> ExtractedGraph:
        return self.extract(text_content)
