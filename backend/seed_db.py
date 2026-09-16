"""
Court Evidence Management System (CEMS)
Database Setup & Seeding Script
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from config import Config
import pymysql

def split_sql_statements(sql):
    """Split SQL script into individual statements respecting quotes and escapes."""
    statements = []
    current = []
    in_single_quote = False
    in_double_quote = False
    escape = False

    for c in sql:
        if escape:
            current.append(c)
            escape = False
        elif c == '\\':
            current.append(c)
            escape = True
        elif c == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            current.append(c)
        elif c == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            current.append(c)
        elif c == ';' and not in_single_quote and not in_double_quote:
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
        else:
            current.append(c)

    remaining = "".join(current).strip()
    if remaining:
        statements.append(remaining)
    return statements

def run_sql_file(cursor, file_path):
    """Execute all SQL commands in a given file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    statements = split_sql_statements(sql)
    for stmt in statements:
        # Ignore comments-only chunks
        clean_lines = [line for line in stmt.splitlines() if not line.strip().startswith('--')]
        clean_stmt = "\n".join(clean_lines).strip()
        if clean_stmt:
            cursor.execute(clean_stmt)

def init_database():
    print("=" * 60)
    print(" CEMS MySQL Database Initialization & Seeder")
    print("=" * 60)
    print(f"Connecting to MySQL at {Config.DB_HOST}:{Config.DB_PORT} as {Config.DB_USER}...")

    # Connect to MySQL server without selecting database first
    conn = pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        charset='utf8mb4',
        autocommit=True
    )

    try:
        with conn.cursor() as cursor:
            # 1. Create database if it doesn't exist
            print(f"Ensuring database '{Config.DB_NAME}' exists...")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            cursor.execute(f"USE `{Config.DB_NAME}`;")

            # 2. Apply Schema
            schema_file = backend_dir / 'database' / 'schema.sql'
            print(f"Applying schema from {schema_file.name}...")
            run_sql_file(cursor, schema_file)
            print("[OK] Schema applied successfully.")

            # 3. Apply Seed Data
            seed_file = backend_dir / 'database' / 'seed.sql'
            print(f"Applying seed data from {seed_file.name}...")
            run_sql_file(cursor, seed_file)
            print("[OK] Seed data inserted successfully.")

            # 4. Verify counts
            print("\nTable record counts:")
            tables = ['users', 'cases', 'evidence', 'custody_records', 'hearings', 'documents', 'court_submissions', 'activity_logs', 'notifications', 'settings']
            for t in tables:
                cursor.execute(f"SELECT COUNT(*) FROM `{t}`;")
                count = cursor.fetchone()[0]
                print(f"  - {t:<20}: {count} records")

        print("\n[SUCCESS] Database setup and seeding completed successfully!")
    except Exception as e:
        print(f"\n[ERROR] Error during database setup: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    init_database()
