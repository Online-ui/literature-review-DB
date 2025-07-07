from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
engine = create_engine(DATABASE_URL)
Base = declarative_base()

# Import models after Base is defined
from api import projects

app = FastAPI(
    title="Literature Review Database",
    version="1.0.0",
    description="Discover and explore academic research projects"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://uhas-research-hub.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
try:
    # Import here to avoid circular imports
    from models.project import Project
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️  Database setup warning: {e}")

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Literature Review Database",
        "version": "1.0.0",
        "storage_backend": "database",
        "api_docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "storage_backend": "database"
    }
