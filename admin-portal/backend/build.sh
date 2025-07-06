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
from sqlalchemy import text
try:
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('✓ Database connection successful')
except Exception as e:
    print(f'✗ Database connection failed: {e}')
    exit(1)
"

echo "3. Checking Supabase storage configuration..."
python -c "
from app.core.config import settings
if settings.STORAGE_BACKEND == 'supabase':
    if settings.has_supabase:
        print('✓ Supabase storage configured')
        try:
            from app.services.supabase_storage import supabase_storage
            if supabase_storage:
                print('✓ Supabase storage service initialized')
            else:
                print('⚠️  Supabase storage service not initialized')
        except Exception as e:
            print(f'⚠️  Supabase storage error: {e}')
    else:
        print('✗ Supabase credentials missing')
        exit(1)
else:
    print(f'ℹ️  Using {settings.STORAGE_BACKEND} storage backend')
"

echo "4. Running database migrations..."
# Since you're starting fresh, create all tables
python -c "
from app.database import engine
from app.models import Base
print('Creating database tables...')
Base.metadata.create_all(bind=engine)
print('✓ Database tables created')
"

echo "5. Creating/verifying admin user..."
if [ -f create_admin.py ]; then
    python create_admin.py || echo "Admin user might already exist"
else
    echo "Warning: create_admin.py not found, skipping admin creation"
fi

echo "6. Testing storage backend..."
python -c "
from app.core.config import settings
if settings.STORAGE_BACKEND == 'supabase':
    try:
        from app.services.supabase_storage import supabase_storage
        if supabase_storage:
            # Test bucket access
            files = supabase_storage.list_files('projects')
            print(f'✓ Supabase bucket accessible (found {len(files) if files else 0} files)')
        else:
            print('⚠️  Supabase storage not available')
    except Exception as e:
        print(f'⚠️  Supabase test failed: {e}')
elif settings.STORAGE_BACKEND == 'local':
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f'✓ Local upload directory created: {settings.UPLOAD_DIR}')
"

echo "=== Admin Portal Build Completed Successfully ==="
