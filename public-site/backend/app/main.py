from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pathlib import Path
import os
import httpx
import io

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

# Admin portal URL - use environment variable or default
ADMIN_PORTAL_URL = os.getenv("ADMIN_PORTAL_URL", "https://literature-rev-admin-portal.onrender.com")
print(f"Admin portal URL configured: {ADMIN_PORTAL_URL}")

# Create async HTTP client with longer timeout
async_client = httpx.AsyncClient(timeout=30.0)

# Proxy image requests to admin portal
async def proxy_image_from_admin(path: str):
    """Proxy image requests to admin portal"""
    try:
        # Clean the path
        clean_path = path.strip('/')
        
        # Request image from admin portal's public endpoint
        url = f"{ADMIN_PORTAL_URL}/api/projects/public/images/{clean_path}"
        print(f"Proxying image request to: {url}")
        
        response = await async_client.get(url)
        
        if response.status_code == 200:
            # Return the image with proper headers
            return Response(
                content=response.content,
                media_type=response.headers.get("content-type", "image/png"),
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Length": str(len(response.content))
                }
            )
        else:
            print(f"Admin portal returned {response.status_code} for image: {clean_path}")
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Image not found: {clean_path}"
            )
            
    except httpx.TimeoutException:
        print(f"Timeout fetching image: {path}")
        raise HTTPException(status_code=504, detail="Timeout fetching image")
    except httpx.RequestError as e:
        print(f"Request error fetching image: {e}")
        raise HTTPException(status_code=502, detail="Error connecting to image server")
    except Exception as e:
        print(f"Unexpected error proxying image: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching image: {str(e)}")

# Serve images by proxying to admin portal
@app.get("/uploads/{path:path}")
async def serve_upload(path: str):
    """Proxy uploaded files from admin portal"""
    return await proxy_image_from_admin(path)

@app.get("/api/uploads/{path:path}")
async def serve_upload_api(path: str):
    """Proxy uploaded files from admin portal (API path)"""
    return await proxy_image_from_admin(path)

# Test endpoint to verify proxy is working
@app.get("/api/test-proxy")
async def test_proxy():
    """Test the proxy connection to admin portal"""
    try:
        # Try to fetch a known image
        test_path = "projects/project_7/3a9cb833-5b26-499f-af76-ce5555c9e0e6.png"
        response = await async_client.get(
            f"{ADMIN_PORTAL_URL}/api/projects/public/images/{test_path}"
        )
        
        return {
            "proxy_status": "working",
            "admin_portal_url": ADMIN_PORTAL_URL,
            "test_image_status": response.status_code,
            "test_image_size": len(response.content) if response.status_code == 200 else 0
        }
    except Exception as e:
        return {
            "proxy_status": "error",
            "admin_portal_url": ADMIN_PORTAL_URL,
            "error": str(e)
        }

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(sitemap.router, prefix="/api", tags=["sitemap"])

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "admin_portal_url": ADMIN_PORTAL_URL,
        "image_proxy": "enabled",
        "proxy_test": "/api/test-proxy"
    }

@app.get("/")
async def root():
    return {
        "message": "Literature Review Public API",
        "docs": "/docs",
        "health": "/api/health",
        "admin_portal": ADMIN_PORTAL_URL
    }

# Cleanup on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await async_client.aclose()
