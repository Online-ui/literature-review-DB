import os
from sqlalchemy import create_engine, text

# Test database connection
DATABASE_URL = "postgresql://username:.......d@localhost/literature_db"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("Make sure PostgreSQL is running and database exists")