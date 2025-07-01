from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Create the FastAPI app
app = FastAPI(
    title="Literature Review Database",
    version="1.0.0",
    description="Discover and explore academic research projects and literature reviews",
    docs_url="/docs",  # Make sure this is set
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://uhas-research-hub.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
os.makedirs("uploads", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Try to include the projects router
try:
    from app.api.projects import router as projects_router
    app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])
    print("✅ Projects router loaded successfully")
except Exception as e:
    print(f"⚠️ Projects router failed to load: {e}")
    
    # Add a simple projects endpoint as fallback
    @app.get("/api/projects/")
    async def get_projects_fallback():
        return {
            "message": "Projects endpoint (fallback)",
            "projects": [],
            "total": 0
        }

# Try to include the sitemap router
try:
    from app.api.sitemap import router as sitemap_router
    app.include_router(sitemap_router, tags=["SEO"])
    print("✅ Sitemap router loaded successfully")
except Exception as e:
    print(f"⚠️ Sitemap router failed to load: {e}")
    
    # Add a simple sitemap endpoint as fallback
    @app.get("/sitemap.xml")
    async def sitemap_fallback():
        return {"message": "Sitemap endpoint (fallback)"}

@app.get("/")
async def root():
    return {
        "message": "Literature Review Database API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Simple test endpoint
@app.get("/api/test")
async def test_endpoint():
    return {"message": "API is working", "status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
