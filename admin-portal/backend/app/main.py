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

# Create upload directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/projects", exist_ok=True)
os.makedirs("uploads/profile_images", exist_ok=True)

# Create static directory for React build if it doesn't exist
os.makedirs("static", exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print(f"🚀 Starting {settings.PROJECT_NAME}")
    print(f"📦 Version: {settings.VERSION}")
    print(f"🗄️  Storage Backend: {settings.STORAGE_BACKEND}")
    print(f"📁 Max file size: {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB")
    print(f"📄 Allowed file types: {', '.join(settings.ALLOWED_FILE_TYPES)}")
    print("✅ Database Storage configured")
    
    # Verify directories
    print("📁 Directories:")
    print(f"   - uploads/ {'✓' if os.path.exists('uploads') else '✗'}")
    print(f"   - uploads/projects/ {'✓' if os.path.exists('uploads/projects') else '✗'}")
    print(f"   - uploads/profile_images/ {'✓' if os.path.exists('uploads/profile_images') else '✗'}")
    print(f"   - static/ {'✓' if os.path.exists('static') else '✗'}")
    
    # Check if React build exists
    index_path = Path("static/index.html")
    if index_path.exists():
        print("✅ React build found")
    else:
        print("⚠️  React build not found - frontend routes will return 404")
    
    # Debug: Print registered routes
    print("\n📍 Registered API Routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(route.methods)
            print(f"  {methods} {route.path}")
    print()

# Include routers - ORDER MATTERS!
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(utils.router, prefix="/api/utils", tags=["utilities"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

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
            "uploads": os.path.exists("uploads"),
            "projects": os.path.exists("uploads/projects"),
            "profile_images": os.path.exists("uploads/profile_images")
        },
        "frontend": os.path.exists("static/index.html")
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

# Serve static files (React build) - this should be after API routes
static_files_path = Path("static")
if static_files_path.exists() and static_files_path.is_dir():
    # Check if there are actual files in the static directory
    if any(static_files_path.iterdir()):
        app.mount("/static", StaticFiles(directory="static"), name="static")
        print("✅ Static files mounted at /static")

# Root route - serve React app
@app.get("/")
async def serve_root():
    """Serve the React app root"""
    index_path = Path("static/index.html")
    if index_path.exists():
        return FileResponse(str(index_path))
    else:
        return JSONResponse(
            status_code=200,
            content={
                "message": "Literature Review Admin Portal API",
                "docs": "/docs",
                "api": "/api",
                "note": "Frontend not deployed. Please build and deploy the React app."
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
        full_path.startswith("static/")):
        # Let FastAPI handle 404 for these routes
        return JSONResponse(
            status_code=404,
            content={"detail": f"Path '{full_path}' not found"}
        )
    
    # For all other routes, serve the React app (if it exists)
    index_path = Path("static/index.html")
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
