from fastapi import FastAPI, HTTPException
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

# Set the correct path to admin portal's uploads directory
ADMIN_UPLOAD_DIR = Path("/opt/render/project/src/admin-portal/backend/app/uploads")

# Verify the path exists
if ADMIN_UPLOAD_DIR.exists():
    print(f"✅ Found uploads directory at: {ADMIN_UPLOAD_DIR}")
    # List some files to confirm
    sample_files = list(ADMIN_UPLOAD_DIR.rglob("*.png"))[:5]
    if sample_files:
        print(f"Sample files: {[f.name for f in sample_files]}")
else:
    print(f"❌ Uploads directory not found at: {ADMIN_UPLOAD_DIR}")

# Helper function to serve uploads
async def serve_upload_file(path: str):
    """Helper to serve uploaded files"""
    if not ADMIN_UPLOAD_DIR or not ADMIN_UPLOAD_DIR.exists():
        raise HTTPException(
            status_code=500, 
            detail=f"Uploads directory not found at {ADMIN_UPLOAD_DIR}"
        )
    
    file_path = ADMIN_UPLOAD_DIR / path
    print(f"Requested file: {file_path}")
    print(f"File exists: {file_path.exists()}")
    
    if file_path.exists() and file_path.is_file():
        # Get file info for debugging
        file_size = file_path.stat().st_size
        print(f"✅ Serving file: {file_path.name}, size: {file_size} bytes")
        
        # Determine content type
        content_type = "application/octet-stream"
        if str(file_path).lower().endswith('.png'):
            content_type = "image/png"
        elif str(file_path).lower().endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif str(file_path).lower().endswith('.gif'):
            content_type = "image/gif"
        
        return FileResponse(
            path=str(file_path),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*"
            }
        )
    
    # Debug: show what files exist in the parent directory
    parent_dir = file_path.parent
    if parent_dir.exists():
        existing_files = [f.name for f in parent_dir.iterdir() if f.is_file()][:5]
        print(f"Files in {parent_dir.name}: {existing_files}")
    
    raise HTTPException(
        status_code=404, 
        detail=f"File not found: {path}"
    )

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
    upload_info = {
        "status": "healthy",
        "uploads_dir": str(ADMIN_UPLOAD_DIR),
        "uploads_exists": ADMIN_UPLOAD_DIR.exists() if ADMIN_UPLOAD_DIR else False,
    }
    
    if ADMIN_UPLOAD_DIR and ADMIN_UPLOAD_DIR.exists():
        # Count files
        all_files = list(ADMIN_UPLOAD_DIR.rglob("*"))
        image_files = [f for f in all_files if f.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif']]
        
        upload_info["total_files"] = len([f for f in all_files if f.is_file()])
        upload_info["total_images"] = len(image_files)
        upload_info["sample_images"] = [str(f.relative_to(ADMIN_UPLOAD_DIR)) for f in image_files[:5]]
    
    return upload_info

@app.get("/api/test-image-direct")
async def test_image_direct():
    """Test serving a known image directly"""
    # Use one of the images from your list
    test_image = "projects/project_7/3a9cb833-5b26-499f-af76-ce5555c9e0e6.png"
    return await serve_upload_file(test_image)

@app.get("/")
async def root():
    return {
        "message": "Literature Review Public API",
        "docs": "/docs",
        "health": "/api/health",
        "uploads_dir": str(ADMIN_UPLOAD_DIR),
        "uploads_exists": ADMIN_UPLOAD_DIR.exists() if ADMIN_UPLOAD_DIR else False
    }
