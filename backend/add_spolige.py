#!/usr/bin/env python3
'''Add spolige column to purchase table.'''
import sys
sys.path.insert(0, '/home/vincent/ryanmart/backend')

from sqlalchemy import create_engine, text
from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

with engine.connect() as conn:
    result = conn.execute(text("ALTER TABLE purchase ADD COLUMN IF NOT EXISTS spolige VARCHAR(256)"))
    # DDL auto-committed
    print('✅ Spolige column added to purchase table (if not exists).')

engine.dispose()
print('Done.')

