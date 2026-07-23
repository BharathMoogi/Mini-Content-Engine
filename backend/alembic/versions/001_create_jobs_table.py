"""create jobs table

Revision ID: 001_create_jobs_table
Revises: 
Create Date: 2026-07-23 23:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_create_jobs_table'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_description', sa.Text(), nullable=True),
        sa.Column('uploaded_image_path', sa.String(length=512), nullable=True),
        sa.Column('generated_prompt', sa.Text(), nullable=True),
        sa.Column('generated_image_url', sa.String(length=512), nullable=True),
        sa.Column(
            'status',
            sa.Enum('Pending', 'Processing', 'Completed', 'Failed', name='job_status_enum', native_enum=False),
            nullable=False,
            server_default='Pending'
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)
    op.create_index(op.f('ix_jobs_product_name'), 'jobs', ['product_name'], unique=False)
    op.create_index(op.f('ix_jobs_status'), 'jobs', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_jobs_status'), table_name='jobs')
    op.drop_index(op.f('ix_jobs_product_name'), table_name='jobs')
    op.drop_index(op.f('ix_jobs_id'), table_name='jobs')
    op.drop_table('jobs')
