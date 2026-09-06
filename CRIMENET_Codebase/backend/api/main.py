"""
VEILLE v4.0 — FastAPI Application Entry Point
Registers all routers, global exception handlers, CORS middleware,
and runs database initialisation on startup.
"""
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import cases, graph, ingestion, geospatial
from api.routers.review_queue import router as review_queue_router
from api.routers.auth import router as auth_router
from api.routers.audit_logs import router as audit_logs_router
from api.routers.ai import router as ai_router
from api.routers.ws import router as ws_router
from api.routers.users import router as users_router
from core.config import settings
from core.logging_config import setup_logging

# Initialise structured JSON logging before anything else
setup_logging()
logger = logging.getLogger("veille.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run on application startup and shutdown: verify DB connectivity."""
    from core.graph_db import graph_db
    from core.database import engine
    from db.models import Base

    logger.info(f"Starting VEILLE API Gateway v4.0 [{settings.APP_ENV}]")

    # Create tables if they don't exist (for development convenience)
    # In production, always use Alembic migrations: `alembic upgrade head`
    if settings.APP_ENV == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL tables initialised (development mode)")

    # Verify Neo4j connectivity
    if graph_db.verify_connectivity():
        logger.info("Neo4j connection verified")
    else:
        logger.warning("Neo4j is not reachable — graph endpoints will return 503")
        
    yield
    # shutdown logic if needed

app = FastAPI(
    title="VEILLE API Gateway",
    lifespan=lifespan,
    description="Multisource intelligence fusion and relationship-analysis system",
    version="4.0.0",
    docs_url="/api/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/api/redoc" if settings.APP_ENV != "production" else None,
)

# ── OpenTelemetry ───────────────────────────────────────────────────────────
from core.telemetry import setup_telemetry
setup_telemetry(app=app)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(cases.router)
app.include_router(graph.router)
app.include_router(ingestion.router)
app.include_router(geospatial.router)
app.include_router(review_queue_router)
app.include_router(audit_logs_router)
app.include_router(ai_router)
app.include_router(ws_router)
app.include_router(users_router)

# ── Global Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler: never expose raw stack traces to the client.
    All unhandled exceptions return a clean 500 JSON response.
    """
    logger.exception(
        "Unhandled exception",
        extra={
            "path": str(request.url.path),
            "method": request.method,
            "error_type": type(exc).__name__,
        },
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. The incident has been logged.",
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"error": "bad_request", "message": str(exc)},
    )


# (Startup logic moved to lifespan)


# ── Health & Root ─────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "VEILLE API Gateway v4.0 is running", "env": settings.APP_ENV}


@app.get("/api/v1/health")
def health_check():
    from core.graph_db import graph_db
    from workers.celery_app import celery_app
    
    celery_status = "disconnected"
    try:
        ping_result = celery_app.control.ping(timeout=0.5)
        if ping_result:
            celery_status = "connected"
    except Exception:
        pass

    return {
        "status": "healthy",
        "version": "4.0.0",
        "neo4j": "connected" if graph_db.verify_connectivity() else "disconnected",
        "celery": celery_status,
    }
