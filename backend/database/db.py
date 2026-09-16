import pymysql
import pymysql.cursors
from contextlib import contextmanager
from config import Config

def get_connection(database=None):
    """
    Establish a connection to MySQL server.
    If database is None, connects using Config.DB_NAME.
    """
    db_name = database if database is not None else Config.DB_NAME
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=db_name,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        charset='utf8mb4'
    )

@contextmanager
def get_db():
    """
    Context manager for database transactions.
    Commits on success, rolls back on exception, closes automatically.
    """
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def query_db(query, args=(), one=False):
    """
    Execute a SELECT query and return list of dicts (or single dict if one=True).
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            rv = cursor.fetchall()
            return (rv[0] if rv else None) if one else rv

def execute_db(query, args=()):
    """
    Execute an INSERT/UPDATE/DELETE query and return lastrowid and affected rows.
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            affected = cursor.execute(query, args)
            last_id = cursor.lastrowid
            return {"last_id": last_id, "affected": affected}

def check_db_health():
    """
    Quickly test MySQL connectivity and return True/False + message.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1 AS health_check")
                res = cursor.fetchone()
                return True, "MySQL is healthy and responsive"
    except Exception as e:
        return False, str(e)
