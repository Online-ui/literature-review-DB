"""Create admin tables

Revision ID: 001_create_admin_tables
Revises: 7246b26025e9
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = '001_create_admin_tables'
down_revision = '7246b26025e9'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Get connection and inspector
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create users table only if it doesn't exist
    if 'users' not in existing_tables:
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
    else:
        # Check if indexes exist and create them if they don't
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
        if 'ix_users_email' not in existing_indexes:
            op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        if 'ix_users_id' not in existing_indexes:
            op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        if 'ix_users_username' not in existing_indexes:
            op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Handle projects table
    if 'projects' in existing_tables:
        # Add created_by_id column to existing projects table if it doesn't exist
        existing_columns = [col['name'] for col in inspector.get_columns('projects')]
        if 'created_by_id' not in existing_columns:
            op.add_column('projects', sa.Column('created_by_id', sa.Integer(), nullable=True))
            
            # Check if foreign key already exists
            existing_fks = inspector.get_foreign_keys('projects')
            fk_exists = any(fk['referred_table'] == 'users' and 'created_by_id' in fk['constrained_columns'] 
                          for fk in existing_fks)
            if not fk_exists:
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
    # Get connection and inspector
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'projects' in existing_tables:
        # Check if created_by_id column exists
        columns = [col['name'] for col in inspector.get_columns('projects')]
        if 'created_by_id' in columns:
            # Find and drop the foreign key constraint
            fks = inspector.get_foreign_keys('projects')
            for fk in fks:
                if 'created_by_id' in fk['constrained_columns']:
                    op.drop_constraint(fk['name'], 'projects', type_='foreignkey')
            op.drop_column('projects', 'created_by_id')
    
    # Drop users table and its indexes if they exist
    if 'users' in existing_tables:
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
        if 'ix_users_username' in existing_indexes:
            op.drop_index(op.f('ix_users_username'), table_name='users')
        if 'ix_users_id' in existing_indexes:
            op.drop_index(op.f('ix_users_id'), table_name='users')
        if 'ix_users_email' in existing_indexes:
            op.drop_index(op.f('ix_users_email'), table_name='users')
        op.drop_table('users')
