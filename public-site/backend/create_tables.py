import sys
import os
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

try:
    from app.database import engine
    from app.models.base import Base
    
    # Import all models to register them
    from app.models.project import Project
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    
except Exception as e:
    print(f"❌ Error creating tables: {e}")