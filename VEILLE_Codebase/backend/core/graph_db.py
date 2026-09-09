"""
VEILLE v4.0 — Neo4j Graph Database Client
Reads connection settings from centralised config (not hardcoded).
"""
from neo4j import GraphDatabase
from core.config import settings
import logging

logger = logging.getLogger(__name__)


class GraphDB:
    """
    Singleton Neo4j driver wrapper.
    Provides connection pooling and session management.
    """

    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            max_connection_pool_size=50,
        )
        logger.info(f"Neo4j driver initialised: {settings.NEO4J_URI}")

    def close(self):
        self.driver.close()

    def get_session(self):
        return self.driver.session()

    def verify_connectivity(self) -> bool:
        """Health check — returns True if Neo4j is reachable."""
        try:
            self.driver.verify_connectivity()
            return True
        except Exception as e:
            logger.error(f"Neo4j connectivity check failed: {e}")
            return False


# Module-level singleton
graph_db = GraphDB()


from contextlib import contextmanager

@contextmanager
def get_graph_session():
    """
    Provides a Neo4j session.
    Always close the session after use (use as context manager or call .close()).

    Usage:
        with get_graph_session() as session:
            result = session.run("MATCH (n) RETURN n LIMIT 1")
    """
    session = graph_db.get_session()
    try:
        yield session
    finally:
        session.close()
