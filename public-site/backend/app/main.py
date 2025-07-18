from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

from .api import projects, sitemap
from .database import engine
from .models.base import Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Literature Review Public API",
    description="Public API for accessing published research projects",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(sitemap.router, prefix="/api", tags=["sitemap"])

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "storage": "database",
        "description": "Images and documents are served from database"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Literature Review Public API",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "projects": "/api/projects",
            "project_detail": "/api/projects/{slug}",
            "project_image": "/api/projects/{project_id}/images/{image_id}",
            "project_document": "/api/projects/{slug}/download",
            "stats": "/api/projects/stats",
            "sitemap": "/api/sitemap.xml"
        }
    }

# Optional: Add startup event for logging
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    print("=" * 60)
    print("Literature Review Public API Started")
    print("=" * 60)
    print("Storage: Database (images and documents)")
    print("API Docs: /docs")
    print("=" * 60)

# Optional: Add debug endpoint to check database connection
@app.get("/api/debug/db-check")
async def check_database():
    """Check database connection and table existence"""
    from sqlalchemy import inspect
    from .database import engine
    
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        return {
            "database": "connected",
            "tables": tables,
            "has_projects": "projects" in tables,
            "has_project_images": "project_images" in tables
        }
    except Exception as e:
        return {
            "database": "error",
            "error": str(e)
        }
