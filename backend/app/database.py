import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Supabase client (for auth and simple queries)
supabase_client: Client = create_client(settings.supabase_url, settings.supabase_key)


@contextmanager
def get_db_connection():
    """Get a direct PostgreSQL connection for complex queries."""
    conn = psycopg2.connect(settings.database_url, cursor_factory=RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db():
    """FastAPI dependency for database connection."""
    with get_db_connection() as conn:
        yield conn
