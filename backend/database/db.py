import os
import re
import sqlite3
from pathlib import Path
from contextlib import contextmanager
import pymysql
import pymysql.cursors
from config import Config

DB_DIR = Path(__file__).resolve().parent
SQLITE_DB_PATH = DB_DIR / "cems.db"

_active_engine = None  # "mysql" or "sqlite"

def check_mysql_accessible():
    """Check if MySQL is reachable with configured credentials."""
    try:
        conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            connect_timeout=2,
            charset='utf8mb4'
        )
        conn.close()
        return True
    except Exception:
        return False

def get_engine():
    """Resolve active database engine (MySQL if reachable, otherwise SQLite)."""
    global _active_engine
    if _active_engine is None:
        if check_mysql_accessible():
            _active_engine = "mysql"
        else:
            _active_engine = "sqlite"
            _ensure_sqlite_initialized()
    return _active_engine

def _ensure_sqlite_initialized():
    """Initializes SQLite tables and seed dataset when running without external MySQL."""
    is_new = not SQLITE_DB_PATH.exists() or SQLITE_DB_PATH.stat().st_size == 0
    if not is_new:
        return

    conn = sqlite3.connect(SQLITE_DB_PATH)
    schema_file = DB_DIR / "schema.sql"
    seed_file = DB_DIR / "seed.sql"

    try:
        if schema_file.exists():
            with open(schema_file, "r", encoding="utf-8") as f:
                schema_sql = f.read()

            create_table_blocks = re.findall(r'CREATE TABLE `(\w+)` \((.*?)\) ENGINE=InnoDB', schema_sql, re.DOTALL)
            for table_name, body in create_table_blocks:
                lines = []
                for line in body.splitlines():
                    line = line.strip().rstrip(',')
                    if not line or line.startswith('INDEX') or line.startswith('CONSTRAINT'):
                        continue
                    line = re.sub(r'INT AUTO_INCREMENT PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', line, flags=re.I)
                    line = re.sub(r'VARCHAR\(\d+\)', 'TEXT', line, flags=re.I)
                    line = re.sub(r'TIMESTAMP DEFAULT CURRENT_TIMESTAMP.*?$', 'DATETIME DEFAULT CURRENT_TIMESTAMP', line, flags=re.I)
                    lines.append(line)
                clean_body = ",\n  ".join(lines)
                sql_stmt = f"CREATE TABLE IF NOT EXISTS `{table_name}` (\n  {clean_body}\n);"
                conn.execute(sql_stmt)

        if seed_file.exists():
            with open(seed_file, "r", encoding="utf-8") as f:
                seed_sql = f.read()

            import sys
            backend_dir = DB_DIR.parent
            if str(backend_dir) not in sys.path:
                sys.path.insert(0, str(backend_dir))
            from seed_db import split_sql_statements

            for raw_stmt in split_sql_statements(seed_sql):
                clean_lines = [l for l in raw_stmt.splitlines() if not l.strip().startswith("--")]
                clean_stmt = "\n".join(clean_lines).strip()
                if clean_stmt.upper().startswith("INSERT INTO"):
                    clean_stmt = clean_stmt.replace(r"\'", "''")
                    try:
                        conn.execute(clean_stmt)
                    except Exception:
                        pass
        conn.commit()
    finally:
        conn.close()

def get_connection(database=None):
    """Establish a connection to MySQL server."""
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
    """Context manager for database transactions."""
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
    """Execute a SELECT query and return list of dicts (or single dict if one=True)."""
    engine = get_engine()
    if engine == "mysql":
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, args)
                rv = cursor.fetchall()
                return (rv[0] if rv else None) if one else rv
    else:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            sqlite_q = query.replace('%s', '?')
            cursor = conn.cursor()
            cursor.execute(sqlite_q, args)
            rows = cursor.fetchall()
            rv = [dict(r) for r in rows]
            return (rv[0] if rv else None) if one else rv
        finally:
            conn.close()

def execute_db(query, args=()):
    """Execute an INSERT/UPDATE/DELETE query and return lastrowid and affected rows."""
    engine = get_engine()
    if engine == "mysql":
        with get_db() as conn:
            with conn.cursor() as cursor:
                affected = cursor.execute(query, args)
                last_id = cursor.lastrowid
                return {"last_id": last_id, "affected": affected}
    else:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        try:
            sqlite_q = query.replace('%s', '?')
            cursor = conn.cursor()
            cursor.execute(sqlite_q, args)
            conn.commit()
            return {"last_id": cursor.lastrowid, "affected": cursor.rowcount}
        finally:
            conn.close()

def check_db_health():
    """Quickly test database connectivity and return True/False + message."""
    engine = get_engine()
    if engine == "mysql":
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1 AS health_check")
                    cursor.fetchone()
                    return True, "MySQL is healthy and responsive"
        except Exception as e:
            return False, str(e)
    else:
        try:
            _ensure_sqlite_initialized()
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            conn.close()
            return True, "SQLite database is healthy and active (cloud fallback)"
        except Exception as e:
            return False, str(e)

