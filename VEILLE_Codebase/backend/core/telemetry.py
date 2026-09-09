"""
VEILLE v4.0 — OpenTelemetry Configuration
Sets up distributed tracing for FastAPI, SQLAlchemy, Redis, and Celery.
Exports traces to an OTLP endpoint if configured.
"""
import logging
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor

from core.config import settings

logger = logging.getLogger(__name__)

def setup_telemetry(app=None, is_celery=False):
    """
    Initialises OpenTelemetry tracing.
    Call this at application startup.
    
    Args:
        app: The FastAPI application instance (if running web server).
        is_celery: True if being called from the Celery worker startup.
    """
    if not settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        logger.info("OpenTelemetry OTLP endpoint not configured. Tracing disabled.")
        return

    # Set up global tracer provider
    resource = Resource.create({
        "service.name": settings.OTEL_SERVICE_NAME,
        "service.namespace": "VEILLE",
        "deployment.environment": settings.APP_ENV,
    })
    
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    
    logger.info(f"OpenTelemetry configured. Exporting to {settings.OTEL_EXPORTER_OTLP_ENDPOINT}")

    # Instrument SQLAlchemy
    try:
        from core.database import engine
        SQLAlchemyInstrumentor().instrument(
            engine=engine,
            enable_commenter=True,
            commenter_options={}
        )
    except Exception as e:
        logger.warning(f"Failed to instrument SQLAlchemy: {e}")

    # Instrument Redis
    try:
        RedisInstrumentor().instrument()
    except Exception as e:
        logger.warning(f"Failed to instrument Redis: {e}")

    if app:
        # Instrument FastAPI
        try:
            FastAPIInstrumentor.instrument_app(app)
            logger.info("Instrumented FastAPI")
        except Exception as e:
            logger.warning(f"Failed to instrument FastAPI: {e}")

    if is_celery:
        # Instrument Celery
        try:
            CeleryInstrumentor().instrument()
            logger.info("Instrumented Celery workers")
        except Exception as e:
            logger.warning(f"Failed to instrument Celery: {e}")
