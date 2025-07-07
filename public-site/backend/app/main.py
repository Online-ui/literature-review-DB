from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from .models import Base
from .api import projects
from .core.config import settings

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️  Database table creation warning: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://uhas-research-hub.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"]
)
# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])

# Add sitemap router if it exists
try:
    from .api import sitemap
    app.include_router(sitemap.router, prefix="/api", tags=["sitemap"])
except ImportError:
    print("⚠️  Sitemap module not found, skipping...")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "api_docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
