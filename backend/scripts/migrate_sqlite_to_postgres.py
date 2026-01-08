#!/usr/bin/env python3
"""
Migrate data from the local SQLite database (backend/instance/fruittrack.db)
into the Postgres database specified by DATABASE_URL.

Steps performed:
1) Ensure Postgres tables exist via Flask app context (db.create_all()).
2) For each table present in SQLite and Postgres, copy all rows if the Postgres
   table is currently empty.
3) Best-effort sequence reset for tables with an integer 'id' column.

Usage:
  DATABASE_URL=postgresql://user:pass@host:port/dbname \
  python backend/scripts/migrate_sqlite_to_postgres.py

Optional env vars:
  SQLITE_PATH: override path to sqlite file (default: backend/instance/fruittrack.db)
  CHUNK_SIZE: number of rows per insert batch (default: 1000)
"""
import os
import sys
from contextlib import contextmanager
from sqlalchemy import create_engine, MetaData, Table, select, text
from sqlalchemy.engine import Engine
from sqlalchemy import inspect as sa_inspect

# Ensure we can import the Flask app and db
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app import create_app  # type: ignore
from backend.extensions import db  # type: ignore


def get_sqlite_path() -> str:
    override = os.environ.get("SQLITE_PATH")
    if override:
        return override
    return os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'fruittrack.db'))


def ensure_pg_tables_exist(pg_url: str) -> None:
    os.environ['DATABASE_URL'] = pg_url
    app = create_app()
    with app.app_context():
        db.create_all()
        app.logger.info("Ensured Postgres tables exist (create_all).")


@contextmanager
def connect_engine(url: str):
    engine: Engine = create_engine(url, future=True)
    conn = engine.connect()
    try:
        yield engine, conn
    finally:
        conn.close()
        engine.dispose()


def reset_identity_sequence_pg(conn, table_name: str):
    try:
        sql = text(
            "SELECT setval(pg_get_serial_sequence(:tname, 'id'), COALESCE(MAX(id), 1)) FROM "
            f'"{table_name}"'
        )
        conn.execute(sql, {"tname": table_name})
    except Exception as e:
        print(f"[WARN] Could not reset sequence for table {table_name}: {e}")


def table_row_count(conn, table: Table) -> int:
    res = conn.execute(select(text('count(1)')).select_from(table))
    return int(res.scalar() or 0)


def migrate(sqlite_url: str, pg_url: str, chunk_size: int = 1000):
    ensure_pg_tables_exist(pg_url)

    with connect_engine(sqlite_url) as (sqlite_engine, sqlite_conn), \
         connect_engine(pg_url) as (pg_engine, pg_conn):

        sqlite_inspector = sa_inspect(sqlite_engine)
        pg_inspector = sa_inspect(pg_engine)

        sqlite_tables = set(sqlite_inspector.get_table_names())
        pg_tables = set(pg_inspector.get_table_names())

        common_tables = [t for t in sqlite_tables if t in pg_tables]

        # Sort tables in dependency order
        common_tables.sort(key=lambda t: t.lower())

        print(f"SQLite path: {sqlite_url}")
        print(f"Postgres URL: {pg_url}")
        print(f"Found {len(common_tables)} common tables to consider for migration.")

        sqlite_meta = MetaData()
        pg_meta = MetaData()

        for tname in common_tables:
            with pg_engine.begin() as table_conn:  # per-table transaction
                sqlite_table = Table(tname, sqlite_meta, autoload_with=sqlite_engine)
                pg_table = Table(tname, pg_meta, autoload_with=pg_engine)

                target_count = table_row_count(table_conn, pg_table)
                if target_count > 0:
                    print(f"[SKIP] {tname}: target already has {target_count} rows.")
                    continue

                print(f"[COPY] {tname}: starting copy...")
                result = sqlite_conn.execute(select(sqlite_table))
                total = 0
                while True:
                    rows = result.fetchmany(chunk_size)
                    if not rows:
                        break
                    payload = [dict(row._mapping) for row in rows]
                    table_conn.execute(pg_table.insert(), payload)
                    total += len(payload)
                print(f"[DONE] {tname}: copied {total} rows.")

                if 'id' in pg_table.c:
                    reset_identity_sequence_pg(table_conn, tname)

        print("Migration completed.")


def main():
    pg_url = os.environ.get('DATABASE_URL')
    if not pg_url:
        print("ERROR: DATABASE_URL environment variable is required for Postgres.")
        sys.exit(1)

    sqlite_path = get_sqlite_path()
    if not os.path.exists(sqlite_path):
        print(f"ERROR: SQLite database not found at {sqlite_path}")
        sys.exit(1)

    sqlite_url = f"sqlite:///{sqlite_path}"
    chunk_size = int(os.environ.get('CHUNK_SIZE', '1000'))
    migrate(sqlite_url, pg_url, chunk_size)


if __name__ == '__main__':

    main()