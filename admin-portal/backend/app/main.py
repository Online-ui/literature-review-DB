from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from .core.config import settings
from .database import engine
from .models import Base
from .api import auth, users, dashboard, projects, utils, profile

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Get the absolute path to the backend directory
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

# Create upload directories if they don't exist
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "projects").mkdir(exist_ok=True)
(UPLOAD_DIR / "profile_images").mkdir(exist_ok=True)

# Create static directory for React build if it doesn't exist
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)

print(f"🚀 Starting {settings.PROJECT_NAME}")
print(f"📁 Base directory: {BASE_DIR}")
print(f"📁 Upload directory: {UPLOAD_DIR}")
print(f"📁 Upload directory exists: {UPLOAD_DIR.exists()}")
print(f"📁 Static directory: {STATIC_DIR}")

# Fixed validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_messages.append(f"{field}: {message}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "; ".join(error_messages),
            "type": "validation_error",
            "errors": [
                {
                    "loc": list(error["loc"]),
                    "msg": error["msg"],
                    "type": error["type"]
                }
                for error in exc.errors()
            ]
        }
    )

# CORS middleware - MUST come before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://literature-rev-admin-portal.onrender.com"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(utils.router, prefix="/api/utils", tags=["utilities"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

# Serve static files manually since the automatic mount isn't working
@app.get("/uploads/{path:path}")
async def serve_upload(path: str):
    """Manually serve uploaded files"""
    file_path = UPLOAD_DIR / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return JSONResponse(
        status_code=404,
        content={"error": "File not found", "path": str(file_path)}
    )

# Also handle the /api/uploads path that frontend is using
@app.get("/api/uploads/{path:path}")
async def serve_upload_api(path: str):
    """Serve uploaded files from /api/uploads path"""
    file_path = UPLOAD_DIR / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return JSONResponse(
        status_code=404,
        content={"error": "File not found", "path": str(file_path)}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print(f"\n{'='*60}")
    print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"{'='*60}")
    print(f"📦 Storage Backend: {settings.STORAGE_BACKEND}")
    print(f"📁 Max file size: {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB")
    print(f"📄 Allowed file types: {', '.join(settings.ALLOWED_FILE_TYPES)}")
    print(f"✅ Database Storage configured")
    
    # Verify directories
    print(f"\n📁 Directory Status:")
    print(f"   - uploads/ {'✅' if UPLOAD_DIR.exists() else '❌'}")
    print(f"   - uploads/projects/ {'✅' if (UPLOAD_DIR / 'projects').exists() else '❌'}")
    print(f"   - uploads/profile_images/ {'✅' if (UPLOAD_DIR / 'profile_images').exists() else '❌'}")
    print(f"   - static/ {'✅' if STATIC_DIR.exists() else '❌'}")
    
    # Check if React build exists
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        print(f"✅ React build found at {index_path}")
    else:
        print(f"⚠️  React build not found - frontend routes will return 404")
    
    # Debug: Print registered routes
    print(f"\n📍 Registered Routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(route.methods) if route.methods else 'N/A'
            print(f"   {methods:8} {route.path}")
    print(f"{'='*60}\n")

# API root endpoint
@app.get("/api")
async def api_root():
    return {
        "message": "Literature Review Database - Admin Portal API",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "database": "connected",
        "max_file_size_mb": settings.MAX_FILE_SIZE / 1024 / 1024,
        "upload_dirs": {
            "uploads": UPLOAD_DIR.exists(),
            "projects": (UPLOAD_DIR / "projects").exists(),
            "profile_images": (UPLOAD_DIR / "profile_images").exists()
        },
        "frontend": (STATIC_DIR / "index.html").exists(),
        "paths": {
            "base_dir": str(BASE_DIR),
            "upload_dir": str(UPLOAD_DIR),
            "static_dir": str(STATIC_DIR)
        }
    }

@app.get("/api/config")
async def get_config():
    """Get public configuration for frontend"""
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "max_file_size": settings.MAX_FILE_SIZE,
        "allowed_file_types": settings.ALLOWED_FILE_TYPES,
        "cors_origins": settings.CORS_ORIGINS
    }

# Debug endpoint to list files
@app.get("/api/debug/list-uploads")
async def list_uploads():
    """List all files in uploads directory"""
    files = []
    if UPLOAD_DIR.exists():
        for root, dirs, filenames in os.walk(UPLOAD_DIR):
            for filename in filenames:
                rel_path = os.path.relpath(os.path.join(root, filename), UPLOAD_DIR)
                files.append(rel_path)
    return {
        "upload_dir": str(UPLOAD_DIR),
        "exists": UPLOAD_DIR.exists(),
        "files": files,
        "total_files": len(files)
    }

# Test route for static files
@app.get("/test-static")
async def test_static():
    """Test if static files are accessible"""
    test_files = []
    if UPLOAD_DIR.exists():
        for root, dirs, files in os.walk(UPLOAD_DIR):
            for file in files[:5]:  # Limit to first 5 files
                rel_path = os.path.relpath(os.path.join(root, file), UPLOAD_DIR)
                test_files.append({
                    "path": rel_path,
                    "urls": [
                        f"/uploads/{rel_path}",
                        f"/api/uploads/{rel_path}"
                    ]
                })
    
    return {
        "message": "Static file test",
        "upload_dir": str(UPLOAD_DIR),
        "exists": UPLOAD_DIR.exists(),
        "sample_files": test_files,
        "instructions": "Try accessing the URLs listed in sample_files"
    }

# Serve static files (React build) - this should be after API routes
if STATIC_DIR.exists() and any(STATIC_DIR.iterdir()):
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    print(f"✅ React static files mounted at /static")

# Root route - serve React app
@app.get("/")
async def serve_root():
    """Serve the React app root"""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    else:
        return JSONResponse(
            status_code=200,
            content={
                "message": "Literature Review Admin Portal API",
                "docs": "/docs",
                "api": "/api",
                "note": "Frontend not deployed. Please build and deploy the React app.",
                "test_uploads": "/test-static",
                "debug_uploads": "/api/debug/list-uploads"
            }
        )

# Catch-all route for client-side routing - MUST BE LAST
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """Serve the React app for all non-API routes"""
    # Skip API routes, uploads, docs, and static files
    if (full_path.startswith("api/") or 
        full_path.startswith("uploads/") or 
        full_path.startswith("docs") or 
        full_path.startswith("redoc") or
        full_path.startswith("openapi.json") or
        full_path.startswith("static/") or
        full_path.startswith("test-static")):
        # Let FastAPI handle 404 for these routes
        return JSONResponse(
            status_code=404,
            content={"detail": f"Path '{full_path}' not found"}
        )
    
    # For all other routes, serve the React app (if it exists)
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    else:
        # If no React build, return a helpful message
        return JSONResponse(
            status_code=404,
            content={
                "detail": "Frontend not found",
                "message": "The React app has not been built or deployed.",
                "api_docs": "/docs",
                "api_root": "/api"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        reload=True,
        log_level="info"
    )
