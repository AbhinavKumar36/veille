import logging
import os
import sys
from pathlib import Path
from typing import Optional



logger = logging.getLogger('veille.transcriber')

_whisper_model = None
_whisper_available: Optional[bool] = None

WHISPER_MODEL_SIZE = os.environ.get('WHISPER_MODEL', 'base')

def _load_model():
    global _whisper_model, _whisper_available
    if _whisper_available is False:
        return None
    if _whisper_model is not None:
        return _whisper_model
    try:
        import whisper  # type: ignore
        logger.info(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model (first-time download if not cached)...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
        _whisper_available = True
        logger.info(f"Whisper model '{WHISPER_MODEL_SIZE}' ready.")
        return _whisper_model
    except ImportError:
        logger.warning("openai-whisper not installed. Audio transcription disabled.")
        _whisper_available = False
        return None
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        _whisper_available = False
        return None

def transcribe_audio(audio_path: str) -> Optional[str]:
    audio_path = str(audio_path)
    sidecar_path = f"{audio_path}.transcript.txt"

    if os.path.exists(sidecar_path):
        try:
            content = Path(sidecar_path).read_text(encoding='utf-8').strip()
            if content:
                logger.info(f"Returning cached transcript for {os.path.basename(audio_path)}")
                return content
        except Exception:
            pass

    if not os.path.exists(audio_path):
        logger.warning(f"Audio file not found: {audio_path}")
        return None

    model = _load_model()
    if model is None:
        return None

    try:
        logger.info(f"Transcribing {os.path.basename(audio_path)} with Whisper '{WHISPER_MODEL_SIZE}'...")
        result = model.transcribe(
            audio_path,
            language=None,
            task='transcribe',
            fp16=False,
            verbose=False,
        )
        text = (result.get('text') or '').strip()
        if not text:
            logger.warning(f"Whisper returned empty transcript for {audio_path}")
            return None

        try:
            Path(sidecar_path).write_text(text, encoding='utf-8')
        except Exception as cache_err:
            logger.warning(f"Could not write transcript sidecar: {cache_err}")

        logger.info(f"Transcription complete: {len(text)} chars from {os.path.basename(audio_path)}")
        return text

    except Exception as e:
        logger.error(f"Whisper transcription failed for {audio_path}: {type(e).__name__}: {e}")
        return None


