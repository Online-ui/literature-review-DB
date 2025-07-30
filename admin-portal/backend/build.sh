#!/usr/bin/env bash
set -o errexit

echo "=== Starting Admin Portal Build ==="
echo "Timestamp: $(date)"
echo "Current directory: $(pwd)"

# Backend setup
echo "=== BACKEND SETUP ==="
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

echo "3. Running database migrations..."
python -c "
from app.database import engine
from app.models import Base
print('Creating/updating database tables...')
Base.metadata.create_all(bind=engine)
print('✓ Database tables ready')
"

echo "4. Testing database storage..."
python -c "
from app.core.config import settings
print(f'Storage backend: {settings.STORAGE_BACKEND}')
print(f'Max file size: {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB')
print(f'Allowed file types: {settings.ALLOWED_FILE_TYPES}')

try:
    from app.services.database_storage import database_storage
    health = database_storage.health_check()
    print(f'✓ Database storage service: {health[\"status\"]}')
except Exception as e:
    print(f'⚠️  Database storage test failed: {e}')
"

echo "5. Creating upload directories..."
python -c "
from pathlib import Path
upload_dir = Path('app/uploads')
upload_dir.mkdir(exist_ok=True)
(upload_dir / 'profile_images').mkdir(exist_ok=True)
(upload_dir / 'projects').mkdir(exist_ok=True)
print('✓ Upload directories created')
"

echo "6. Creating/verifying admin user..."
if [ -f create_admin.py ]; then
    python create_admin.py || echo "Admin user might already exist"
else
    echo "Warning: create_admin.py not found, skipping admin creation"
fi

# Frontend setup (if frontend directory exists)
echo ""
echo "=== FRONTEND SETUP ==="
if [ -d "../frontend" ]; then
    echo "7. Building React frontend..."
    cd ../frontend
    
    echo "   Installing npm dependencies..."
    npm install --legacy-peer-deps
    
    echo "   Building React app..."
    # Disable treating warnings as errors by setting CI=false
    CI=false npm run build
    
    echo "   Copying build to backend static directory..."
    cd ../backend
    mkdir -p app/static
    cp -r ../frontend/build/* app/static/
    
    echo "✓ Frontend build completed and copied to static directory"
else
    echo "⚠️  Frontend directory not found, skipping React build"
    echo "   The API will work but the web interface won't be available"
fi

# Final verification
echo ""
echo "=== BUILD VERIFICATION ==="
echo "8. Verifying build..."
python -c "
from pathlib import Path
import os

# Check backend
print('Backend verification:')
print(f'  ✓ Python version: {os.sys.version.split()[0]}')
print(f'  ✓ Working directory: {os.getcwd()}')

# Check uploads directory
uploads = Path('app/uploads')
exists_symbol = '✓' if uploads.exists() else '✗'
print(f'  {exists_symbol} Uploads directory: {uploads.absolute()}')

profile_exists = '✓' if (uploads / 'profile_images').exists() else '✗'
print(f'  {profile_exists} Profile images directory')

projects_exists = '✓' if (uploads / 'projects').exists() else '✗'
print(f'  {projects_exists} Projects directory')

# Check static directory
static = Path('app/static')
if static.exists() and (static / 'index.html').exists():
    print(f'  ✓ Frontend build found at: {static.absolute()}')
else:
    print(f'  ⚠️  Frontend build not found (API-only mode)')

# Check environment
print('')
print('Environment:')
render_status = 'Yes' if os.environ.get('RENDER') else 'No'
print(f'  RENDER: {render_status}')

db_status = 'Set' if os.environ.get('DATABASE_URL') else 'Not set'
print(f'  DATABASE_URL: {db_status}')
"

echo ""
echo "=== Admin Portal Build Completed Successfully ==="
echo "Timestamp: $(date)"
