from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from .api import projects, sitemap
from .database import engine
from .models.base import Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Literature Review Public API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the path to admin portal's uploads directory
ADMIN_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent / "admin-portal" / "backend"
ADMIN_UPLOAD_DIR = ADMIN_BACKEND_DIR / "uploads"

print(f"Admin backend directory: {ADMIN_BACKEND_DIR}")
print(f"Admin uploads directory: {ADMIN_UPLOAD_DIR}")
print(f"Admin uploads exists: {ADMIN_UPLOAD_DIR.exists()}")

# Helper function to serve uploads
async def serve_upload_file(path: str):
    """Helper to serve uploaded files"""
    file_path = ADMIN_UPLOAD_DIR / path
    print(f"Requested file: {file_path}")
    
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Try without 'projects/' prefix if not found
    if not file_path.exists() and path.startswith('projects/'):
        alt_path = ADMIN_UPLOAD_DIR / path.replace('projects/', '')
        if alt_path.exists() and alt_path.is_file():
            return FileResponse(alt_path)
    
    return {
        "error": "File not found", 
        "requested": path, 
        "full_path": str(file_path),
        "exists": file_path.exists()
    }

# Serve static files from both /uploads and /api/uploads paths
@app.get("/uploads/{path:path}")
async def serve_upload(path: str):
    """Serve uploaded files from admin portal"""
    return await serve_upload_file(path)

@app.get("/api/uploads/{path:path}")
async def serve_upload_api(path: str):
    """Serve uploaded files from /api/uploads path for compatibility"""
    return await serve_upload_file(path)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(sitemap.router, prefix="/api", tags=["sitemap"])

@app.get("/api/health")
async def health_check():
    # List some files in uploads directory for debugging
    upload_files = []
    if ADMIN_UPLOAD_DIR.exists():
        for root, dirs, files in os.walk(ADMIN_UPLOAD_DIR):
            for file in files[:10]:  # Limit to first 10 files
                rel_path = os.path.relpath(os.path.join(root, file), ADMIN_UPLOAD_DIR)
                upload_files.append(rel_path)
    
    return {
        "status": "healthy",
        "admin_uploads_dir": str(ADMIN_UPLOAD_DIR),
        "uploads_exists": ADMIN_UPLOAD_DIR.exists(),
        "sample_files": upload_files[:5],  # Show first 5 files for debugging
        "test_image_urls": [
            "/uploads/projects/project_7/a4beaba6-2d75-4497-aedd-0cca7570e944.png",
            "/api/uploads/projects/project_7/a4beaba6-2d75-4497-aedd-0cca7570e944.png"
        ]
    }

@app.get("/")
async def root():
    return {
        "message": "Literature Review Public API",
        "docs": "/docs",
        "health": "/api/health"
    }
