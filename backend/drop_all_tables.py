#!/usr/bin/env python3
"""
Script to drop all tables in the database.
This script connects to the database and drops all tables.
Use with caution - this will delete all data and tables.
"""

import os
import sys
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path so we can import config
sys.path.insert(0, os.path.dirname(__file__))

from config import Config

def drop_all_tables():
    """Drop all tables in the database."""
    try:
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

        # Test connection
        with engine.connect() as conn:
            print("✓ Database connection successful")

        # Get all table names
        meta = MetaData()
        meta.reflect(bind=engine)
        table_names = list(meta.tables.keys())

        if not table_names:
            print("No tables found in the database.")
            return

        print(f"Found {len(table_names)} tables: {', '.join(table_names)}")

        # Drop all tables
        with engine.connect() as conn:
            # Disable foreign key checks for PostgreSQL
            conn.execute(text("SET session_replication_role = 'replica';"))

            for table_name in table_names:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
                    print(f"✓ Dropped table: {table_name}")
                except Exception as e:
                    print(f"✗ Failed to drop table {table_name}: {e}")

            # Re-enable foreign key checks
            conn.execute(text("SET session_replication_role = 'origin';"))

            # Also drop alembic_version table if it exists
            try:
                conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
                print("✓ Dropped alembic_version table")
            except Exception as e:
                print(f"✗ Failed to drop alembic_version table: {e}")

            conn.commit()

        print("✓ All tables dropped successfully")

    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("⚠️  WARNING: This will drop ALL tables and data in the database!")
    confirm = input("Are you sure you want to continue? (type 'yes' to confirm): ")
    if confirm.lower() == 'yes':
        drop_all_tables()
    else:
        print("Operation cancelled.")
