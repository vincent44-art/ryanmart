#!/usr/bin/env python3
'''Add created_by column to spolige table for schema sync.'''
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

print("🔍 Checking if spolige.created_by exists...")
with engine.connect() as conn:
    # Check if column exists
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'spolige' AND column_name = 'created_by'
    """))
    exists = result.fetchone()
    
    if exists:
        print("✅ spolige.created_by column already exists. No changes needed.")
    else:
        print("➕ Adding spolige.created_by column...")
        conn.execute(text("""
            ALTER TABLE spolige 
            ADD COLUMN IF NOT EXISTS created_by INTEGER,
            ADD CONSTRAINT fk_spolige_created_by 
            FOREIGN KEY (created_by) REFERENCES "user"(id)
        """))
        print("✅ created_by column added with FK constraint.")
    
    # Verify
    result = conn.execute(text("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'spolige' AND column_name = 'created_by'
    """))
    col_info = result.fetchone()
    if col_info:
        print(f"✓ Verified: {col_info}")

engine.dispose()
print('✅ Done. Spolige schema synced.')
