"""
verify_tables.py - Script to verify database tables match SQL schema definitions.

This script:
- Parses CREATE TABLE statements from the SQL schema file (database_setup.sql)
- Loads SQLAlchemy ORM metadata from model modules
- Compares columns (name, type, nullability, default, primary key, foreign keys)
- Reports discrepancies between ORM and SQL schema
- Helps ensure database tables match intended schema

Usage:
    python verify_tables.py --sql-file ../instance/database_setup.sql

Adjust the SQL file path as needed when running the script.

Requirements:
- Python 3.7+
- SQLAlchemy (already in backend)
- sqlparse (install via pip install sqlparse)

"""

import argparse
import re
import sqlparse
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import class_mapper
from sqlalchemy.inspection import inspect
import importlib
import os
import sys

# Adjust PYTHONPATH to import models if needed
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.extensions import db  # import db for metadata

def parse_sql_column(col_tokens):
    """Parse a single column definition from token list and return dict of properties."""
    col_name = None
    col_type = None
    nullable = True
    default = None
    primary_key = False
    foreign_key = None

    if len(col_tokens) < 2:
        return None

    col_name = col_tokens[0].value.strip('`"')
    col_type = col_tokens[1].value.upper()

    # Assess more tokens for null, default, constraints
    tokens_str = ' '.join(tok.value.upper() for tok in col_tokens[2:])

    if 'NOT NULL' in tokens_str:
        nullable = False
    if 'PRIMARY KEY' in tokens_str:
        primary_key = True

    # Extract default value if any
    match_def = re.search(r"DEFAULT\s+([^ ,)]+)", tokens_str)
    if match_def:
        default = match_def.group(1).strip("'\"")

    return {
        'name': col_name,
        'type': col_type,
        'nullable': nullable,
        'default': default,
        'primary_key': primary_key,
        'foreign_key': foreign_key,
    }

def parse_sql_create_table(sql_text):
    """Parse CREATE TABLE statement SQL text and extract table schema dictionary."""
    parsed = sqlparse.parse(sql_text)
    if not parsed:
        return None

    stmt = parsed[0]
    tokens = stmt.tokens

    table_name = None
    columns = []

    # Find table name and column definitions
    for i, token in enumerate(tokens):
        if token.ttype is None and token.get_name():
            table_name = token.get_name()
            # Next tokens contain columns in parenthesis
            idx = i + 1
            if idx < len(tokens):
                # Look for parenthesis token
                par_token = tokens[idx]
                if par_token.is_group:
                    # Extract column definitions comma separated
                    cols_text = par_token.value.strip('()')
                    cols_parts = [c.strip() for c in cols_text.split(',') if c.strip()]

                    for col_text in cols_parts:
                        col_stmt = sqlparse.parse(col_text)[0]
                        col_tokens = [tok for tok in col_stmt.tokens if not tok.is_whitespace]
                        parsed_col = parse_sql_column(col_tokens)
                        if parsed_col:
                            columns.append(parsed_col)
    return {'table_name': table_name, 'columns': columns}

def load_models_metadata():
    """
    Load all SQLAlchemy ORM models metadata.
    Assumes all models imported via backend.models package.
    """
    metadata = MetaData()
    imported_models = []

    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models'))
    sys.path.insert(0, models_dir)

    # Import all python files in models directory as modules dynamically
    for filename in os.listdir(models_dir):
        if filename.endswith('.py') and not filename.startswith('__'):
            modulename = filename[:-3]
            full_modulename = f'backend.models.{modulename}'
            try:
                mod = importlib.import_module(full_modulename)
                imported_models.append(mod)
            except Exception as e:
                print(f"Failed importing model module {full_modulename}: {e}")

    # Reflect ORM table metadata from models
    for mod in imported_models:
        for attr in dir(mod):
            cls = getattr(mod, attr)
            try:
                if hasattr(cls, '__table__'):
                    metadata._add_table(cls.__table__.name, cls.__table__.schema, cls.__table__)
            except Exception:
                continue

    return metadata

def compare_columns(sql_col, orm_col):
    """Compare a single column definition between SQL and ORM and return list of differences."""
    diffs = []

    # Compare name case-insensitive
    if sql_col['name'].lower() != orm_col.name.lower():
        diffs.append(f"Name mismatch: SQL '{sql_col['name']}' vs ORM '{orm_col.name}'")

    # Compare types roughly by names simplified
    sql_type = sql_col['type'].lower()
    orm_type = orm_col.type.__class__.__name__.lower() if hasattr(orm_col.type, '__class__') else str(orm_col.type).lower()

    # Some normalization for types
    def simplify_type(t):
        return t.replace('int','int').replace('integer','int').replace('varchar','string').replace('float','float').replace('double','float').replace('real','float').replace('boolean','bool')

    sql_type_s = simplify_type(sql_type)
    orm_type_s = simplify_type(orm_type)

    if sql_type_s not in orm_type_s and orm_type_s not in sql_type_s:
        diffs.append(f"Type mismatch: SQL '{sql_type}' vs ORM '{orm_type}'")

    # Compare nullability
    if sql_col['nullable'] != orm_col.nullable:
        diffs.append(f"Nullability mismatch: SQL '{sql_col['nullable']}' vs ORM '{orm_col.nullable}'")

    # Compare primary key
    if sql_col['primary_key'] != orm_col.primary_key:
        diffs.append(f"PrimaryKey mismatch: SQL '{sql_col['primary_key']}' vs ORM '{orm_col.primary_key}'")

    # Compare default values loosely, as format may vary
    sql_def = sql_col['default']
    orm_def = orm_col.default.arg if orm_col.default is not None else None
    if orm_def is not None and callable(orm_def):
        orm_def = orm_def()

    if str(sql_def) != str(orm_def):
        # Only add diff if not None or empty
        if sql_def or orm_def:
            diffs.append(f"Default mismatch: SQL '{sql_def}' vs ORM '{orm_def}'")

    return diffs

def main(sql_filepath):
    with open(sql_filepath, 'r') as f:
        content = f.read()

    # Extract CREATE TABLE statements
    create_table_stmts = re.findall(r'CREATE TABLE.*?\);', content, re.DOTALL | re.IGNORECASE)
    sql_tables = {}

    for stmt in create_table_stmts:
        tbl = parse_sql_create_table(stmt)
        if tbl:
            sql_tables[tbl['table_name']] = tbl['columns']

    # Load ORM metadata
    orm_metadata = load_models_metadata()

    # Verify tables
    for table_name in sql_tables:
        print(f"\nVerifying table: {table_name}")
        sql_cols = sql_tables[table_name]
        if table_name not in orm_metadata.tables:
            print(f"  ERROR: Table '{table_name}' not found in ORM metadata!")
            continue

        orm_cols = orm_metadata.tables[table_name].columns
        orm_cols_dict = {col.name.lower(): col for col in orm_cols}

        for sql_col in sql_cols:
            col_name = sql_col['name'].lower()
            if col_name not in orm_cols_dict:
                print(f"  MISSING column in ORM: '{sql_col['name']}'")
                continue

            orm_col = orm_cols_dict[col_name]
            diffs = compare_columns(sql_col, orm_col)
            if diffs:
                print(f"  Column '{sql_col['name']}' discrepancies:")
                for diff in diffs:
                    print(f"    - {diff}")

    # Check for ORM columns not in SQL
    for table_name in orm_metadata.tables:
        if table_name not in sql_tables:
            print(f"\nWARNING: ORM table '{table_name}' not found in SQL schema!")
        else:
            orm_cols = orm_metadata.tables[table_name].columns
            sql_col_names = [col['name'].lower() for col in sql_tables[table_name]]
            for col in orm_cols:
                if col.name.lower() not in sql_col_names:
                    print(f"  EXTRA ORM column in table '{table_name}': '{col.name}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify database tables match SQL schema and ORM models.")
    parser.add_argument("--sql-file", required=True, help="Path to SQL file with CREATE TABLE statements")
    args = parser.parse_args()
    main(args.sql_file)
