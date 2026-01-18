#!/usr/bin/env python3
"""
Script to check and list all tables in the database.
This script connects to the database using the same configuration as the app
and prints out all table names and their column information.
"""

import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path so we can import config
sys.path.insert(0, os.path.dirname(__file__))

from config import Config

def check_database_connection():
    """Test database connection."""
    try:
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection successful")
        return engine
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return None

def list_tables(engine):
    """List all tables in the database."""
    try:
        inspector = inspect(engine)

        # Get all table names
        tables = inspector.get_table_names()
        print(f"\n📋 Found {len(tables)} tables in the database:")
        print("=" * 50)

        for table_name in sorted(tables):
            print(f"\n🔹 Table: {table_name}")

            # Get column information
            columns = inspector.get_columns(table_name)
            if columns:
                print("   Columns:")
                for col in columns:
                    col_type = str(col['type'])
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    default = f" DEFAULT {col['default']}" if col['default'] else ""
                    print(f"     - {col['name']}: {col_type} {nullable}{default}")

            # Get primary key information
            pk = inspector.get_pk_constraint(table_name)
            if pk and pk['constrained_columns']:
                print(f"   Primary Key: {', '.join(pk['constrained_columns'])}")

            # Get foreign key information
            fks = inspector.get_foreign_keys(table_name)
            if fks:
                print("   Foreign Keys:")
                for fk in fks:
                    referred_table = fk['referred_table']
                    local_cols = ', '.join(fk['constrained_columns'])
                    referred_cols = ', '.join(fk['referred_columns'])
                    print(f"     - {local_cols} -> {referred_table}({referred_cols})")

            # Get indexes
            indexes = inspector.get_indexes(table_name)
            if indexes:
                print("   Indexes:")
                for idx in indexes:
                    unique = " UNIQUE" if idx['unique'] else ""
                    cols = ', '.join(idx['column_names'])
                    print(f"     - {idx['name']}: {cols}{unique}")

    except Exception as e:
        print(f"Error listing tables: {e}")

def show_table_counts(engine):
    """Show row counts for each table."""
    try:
        print("\n📊 Table Row Counts:")
        print("=" * 30)

        inspector = inspect(engine)
        tables = inspector.get_table_names()

        with engine.connect() as conn:
            for table_name in sorted(tables):
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = result.scalar()
                    print(f"🔹 {table_name}: {count} rows")
                except Exception as e:
                    print(f"🔹 {table_name}: Error getting count - {e}")

    except Exception as e:
        print(f"Error getting table counts: {e}")

def main():
    print("🔍 Checking database tables on Render...")
    print(f"Database URL: {Config.SQLALCHEMY_DATABASE_URI.split('@')[0]}@[REDACTED]")

    engine = check_database_connection()
    if engine:
        list_tables(engine)
        show_table_counts(engine)
        engine.dispose()
    else:
        print("\n❌ Cannot proceed without database connection.")
        print("\nTroubleshooting tips:")
        print("1. Check your DATABASE_URL environment variable")
        print("2. Ensure your Render database is running")
        print("3. Verify database credentials are correct")
        print("4. Check if your IP is whitelisted in Render database settings")

if __name__ == "__main__":
    main()
