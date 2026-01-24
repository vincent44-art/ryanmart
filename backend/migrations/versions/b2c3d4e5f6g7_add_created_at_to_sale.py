"""add_created_at_to_sale

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-01-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import func

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Add created_at column to sale table
    op.add_column('sale', sa.Column('created_at', sa.DateTime(), nullable=True))
    
    # Update existing records with current timestamp (PostgreSQL compatible)
    op.execute("UPDATE sale SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")


def downgrade():
    # Remove created_at column from sale table
    op.drop_column('sale', 'created_at')

