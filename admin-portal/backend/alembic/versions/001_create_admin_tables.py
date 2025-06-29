"""Create admin tables

Revision ID: 001_create_admin_tables
Revises: 7246b26025e9
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001_create_admin_tables'
down_revision = '7246b26025e9'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('institution', sa.String(), nullable=True),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Check if projects table exists before adding column
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'projects' in tables:
        # Add created_by_id column to existing projects table
        op.add_column('projects', sa.Column('created_by_id', sa.Integer(), nullable=True))
        op.create_foreign_key(None, 'projects', 'users', ['created_by_id'], ['id'])
    else:
        # Create projects table if it doesn't exist
        op.create_table('projects',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('slug', sa.String(), nullable=False),
            sa.Column('abstract', sa.Text(), nullable=True),
            sa.Column('keywords', sa.Text(), nullable=True),
            sa.Column('research_area', sa.String(), nullable=True),
            sa.Column('degree_type', sa.String(), nullable=True),
            sa.Column('academic_year', sa.String(), nullable=True),
            sa.Column('institution', sa.String(), nullable=True),
            sa.Column('department', sa.String(), nullable=True),
            sa.Column('supervisor', sa.String(), nullable=True),
            sa.Column('author_name', sa.String(), nullable=False),
            sa.Column('author_email', sa.String(), nullable=True),
            sa.Column('is_published', sa.Boolean(), nullable=True),
            sa.Column('publication_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('meta_description', sa.Text(), nullable=True),
            sa.Column('meta_keywords', sa.Text(), nullable=True),
            sa.Column('document_url', sa.String(), nullable=True),
            sa.Column('document_filename', sa.String(), nullable=True),
            sa.Column('document_size', sa.Integer(), nullable=True),
            sa.Column('view_count', sa.Integer(), nullable=True),
            sa.Column('download_count', sa.Integer(), nullable=True),
            sa.Column('created_by_id', sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], )
        )
        op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
        op.create_index(op.f('ix_projects_institution'), 'projects', ['institution'], unique=False)
        op.create_index(op.f('ix_projects_is_published'), 'projects', ['is_published'], unique=False)
        op.create_index(op.f('ix_projects_research_area'), 'projects', ['research_area'], unique=False)
        op.create_index(op.f('ix_projects_slug'), 'projects', ['slug'], unique=True)
        op.create_index(op.f('ix_projects_title'), 'projects', ['title'], unique=False)

def downgrade() -> None:
    # Check if projects table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'projects' in tables:
        # Check if created_by_id column exists
        columns = [col['name'] for col in inspector.get_columns('projects')]
        if 'created_by_id' in columns:
            op.drop_constraint(None, 'projects', type_='foreignkey')
            op.drop_column('projects', 'created_by_id')
    
    # Drop users table
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
