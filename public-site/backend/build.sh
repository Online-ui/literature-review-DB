#!/usr/bin/env bash
set -o errexit

echo "=== Starting Public Site Build ==="
echo "Timestamp: $(date)"

echo "1. Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "2. Checking database connection..."
python -c "
from app.database import engine
from sqlalchemy import text
try:
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('✓ Database connection successful')
except Exception as e:
    print(f'✗ Database connection failed: {e}')
    exit(1)
"

echo "3. Running Alembic migrations..."
if alembic current 2>/dev/null; then
    echo "Current migration state:"
    alembic current
    alembic upgrade head
else
    echo "Initializing Alembic..."
    alembic stamp head
fi

echo "4. Creating upload directory..."
mkdir -p uploads

echo "=== Public Site Build Completed Successfully ==="
