import logging
from typing import Generator, Optional, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

engine: Optional[Engine] = None
SessionLocal: Optional[sessionmaker[Session]] = None


def get_engine() -> Optional[Engine]:
    """Safely retrieves or initializes the SQLAlchemy engine.
    Returns None if DATABASE_URL is not configured or contains placeholders.
    """
    global engine
    if engine is not None:
        return engine

    url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
    if not url or "HOST:PORT" in url or "YOUR_PASSWORD" in url or "USER:PASSWORD" in url:
        logger.warning(
            "DATABASE_URL is not configured or contains placeholder values. "
            "Database operations will be disabled."
        )
        return None

    try:
        engine = create_engine(
            url,
            pool_pre_ping=True,
            echo=(settings.ENVIRONMENT == "development"),
        )
        return engine
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        return None


def get_sessionmaker() -> Optional[sessionmaker[Session]]:
    """Safely retrieves or initializes the session factory."""
    global SessionLocal
    if SessionLocal is not None:
        return SessionLocal

    curr_engine = get_engine()
    if curr_engine is None:
        return None

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=curr_engine)
    return SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a database session.
    Raises RuntimeError if database is not configured.
    """
    session_factory = get_sessionmaker()
    if session_factory is None:
        raise RuntimeError("Database connection is not configured.")
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, str]:
    """Safely tests PostgreSQL/Supabase connectivity with a lightweight ping.
    Returns (True, 'connected') or (False, safe_error_message).
    Never leaks passwords, connection strings, or internal traces.
    """
    curr_engine = get_engine()
    if curr_engine is None:
        return False, "Database connection string is not configured or contains placeholder values."

    try:
        with curr_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "connected"
    except Exception as e:
        logger.error(f"Database connectivity check failed: {e}")
        return False, "Database is unavailable or connection could not be established."
