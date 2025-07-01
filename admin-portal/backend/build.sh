#!/usr/bin/env bash
set -o errexit

echo "=== Starting Admin Portal Build ==="
echo "Timestamp: $(date)"

echo "1. Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "2. Checking database connection..."
python -c "
from app.database import engine
try:
    with engine.connect() as conn:
        conn.execute('SELECT 1')
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

echo "4. Creating/verifying admin user..."
if [ -f create_admin.py ]; then
    python create_admin.py || echo "Admin user might already exist"
else
    echo "Warning: create_admin.py not found, skipping admin creation"
fi

echo "5. Creating upload directory..."
mkdir -p uploads

echo "=== Admin Portal Build Completed Successfully ==="
