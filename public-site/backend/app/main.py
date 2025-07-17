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

# Try multiple possible paths for uploads directory
def find_uploads_directory():
    possible_paths = [
        # Current structure
        Path(__file__).resolve().parent.parent.parent.parent / "admin-portal" / "backend" / "uploads",
        # Alternative structure
        Path("/opt/render/project/src/admin-portal/backend/uploads"),
        # Check if uploads is in the same backend
        Path(__file__).resolve().parent / "uploads",
        # Check parent directories
        Path(__file__).resolve().parent.parent / "uploads",
        Path(__file__).resolve().parent.parent.parent / "uploads",
    ]
    
    for path in possible_paths:
        print(f"Checking path: {path}")
        if path.exists() and path.is_dir():
            print(f"✅ Found uploads directory at: {path}")
            # List first few files to confirm
            try:
                files = list(path.rglob("*.png"))[:3] + list(path.rglob("*.jpg"))[:3]
                if files:
                    print(f"Sample files found: {[f.name for f in files]}")
            except:
                pass
            return path
    
    print("❌ No uploads directory found in any expected location")
    return None

# Find the uploads directory
ADMIN_UPLOAD_DIR = find_uploads_directory()

if ADMIN_UPLOAD_DIR:
    print(f"Using uploads directory: {ADMIN_UPLOAD_DIR}")
else:
    print("WARNING: No uploads directory found!")

# Helper function to serve uploads
async def serve_upload_file(path: str):
    """Helper to serve uploaded files"""
    if not ADMIN_UPLOAD_DIR:
        raise HTTPException(status_code=500, detail="Uploads directory not configured")
    
    file_path = ADMIN_UPLOAD_DIR / path
    print(f"Requested file: {file_path}")
    print(f"File exists: {file_path.exists()}")
    
    if file_path.exists() and file_path.is_file():
        # Get file size for debugging
        file_size = file_path.stat().st_size
        print(f"Serving file: {file_path.name}, size: {file_size} bytes")
        return FileResponse(
            path=str(file_path),
            media_type="image/png" if str(file_path).endswith('.png') else "image/jpeg"
        )
    
    # Log what files exist in the directory
    parent_dir = file_path.parent
    if parent_dir.exists():
        existing_files = [f.name for f in parent_dir.iterdir() if f.is_file()]
        print(f"Files in {parent_dir}: {existing_files[:5]}")  # Show first 5 files
    
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
    # List some files in uploads directory for debugging
    upload_files = []
    upload_info = {
        "status": "healthy",
        "uploads_configured": ADMIN_UPLOAD_DIR is not None,
        "uploads_dir": str(ADMIN_UPLOAD_DIR) if ADMIN_UPLOAD_DIR else None,
        "uploads_exists": ADMIN_UPLOAD_DIR.exists() if ADMIN_UPLOAD_DIR else False,
    }
    
    if ADMIN_UPLOAD_DIR and ADMIN_UPLOAD_DIR.exists():
        # Find all image files
        for ext in ['*.png', '*.jpg', '*.jpeg']:
            for file in ADMIN_UPLOAD_DIR.rglob(ext):
                rel_path = file.relative_to(ADMIN_UPLOAD_DIR)
                upload_files.append(str(rel_path))
                if len(upload_files) >= 10:  # Limit to 10 files
                    break
        
        upload_info["sample_files"] = upload_files[:10]
        upload_info["total_files_found"] = len(upload_files)
    
    return upload_info

@app.get("/api/debug/find-uploads")
async def debug_find_uploads():
    """Debug endpoint to find where uploads might be"""
    current_dir = Path(__file__).resolve().parent
    results = {
        "current_file": str(Path(__file__).resolve()),
        "current_dir": str(current_dir),
        "parent_dirs": {},
        "found_uploads": []
    }
    
    # Check various parent directories
    check_dir = current_dir
    for i in range(5):  # Check up to 5 levels up
        results["parent_dirs"][f"level_{i}"] = {
            "path": str(check_dir),
            "contents": [d.name for d in check_dir.iterdir() if d.is_dir()][:10]
        }
        
        # Check for uploads in this directory
        uploads_path = check_dir / "uploads"
        if uploads_path.exists():
            results["found_uploads"].append(str(uploads_path))
        
        # Check for admin-portal
        admin_path = check_dir / "admin-portal" / "backend" / "uploads"
        if admin_path.exists():
            results["found_uploads"].append(str(admin_path))
        
        check_dir = check_dir.parent
    
    # Also check the explicit path
    explicit_path = Path("/opt/render/project/src")
    if explicit_path.exists():
        results["render_src_contents"] = [d.name for d in explicit_path.iterdir() if d.is_dir()]
        
        # Check for uploads in admin-portal
        admin_uploads = explicit_path / "admin-portal" / "backend" / "uploads"
        if admin_uploads.exists():
            results["admin_uploads_found"] = True
            results["admin_uploads_path"] = str(admin_uploads)
            # List some files
            sample_files = []
            for f in admin_uploads.rglob("*"):
                if f.is_file():
                    sample_files.append(str(f.relative_to(admin_uploads)))
                if len(sample_files) >= 5:
                    break
            results["admin_uploads_samples"] = sample_files
    
    return results

@app.get("/")
async def root():
    return {
        "message": "Literature Review Public API",
        "docs": "/docs",
        "health": "/api/health",
        "debug": "/api/debug/find-uploads"
    }
