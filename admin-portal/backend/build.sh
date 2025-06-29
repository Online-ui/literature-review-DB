#!/usr/bin/env bash
set -o errexit

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Creating database tables..."
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"

echo "Running database migrations..."
python -m alembic upgrade head

echo "Creating admin user..."
python create_admin.py
echo "Admin portal build completed successfully!"
