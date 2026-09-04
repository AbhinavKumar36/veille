"""
VEILLE v4.0 — PostgreSQL Database Session
Reads connection URL from centralised config (not hardcoded).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # Reconnect automatically if connection is stale
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    FastAPI dependency that yields a database session and ensures it is
    properly closed after each request, even on error.

    Usage:
        @router.get("/")
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
