from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import os

from .core.config import settings
from .database import engine
from .models import Base
from .api import auth, users, dashboard, projects, utils

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

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
    
    # Debug: Print registered routes
    print("\n📍 Registered API Routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(route.methods)
            print(f"  {methods} {route.path}")
    print()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(utils.router, prefix="/api/utils", tags=["utilities"])

@app.get("/")
async def root():
    return {
        "message": "Literature Review Database - Admin Portal API",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "database": "connected",
        "max_file_size_mb": settings.MAX_FILE_SIZE / 1024 / 1024
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        reload=True,
        log_level="info"
    )
