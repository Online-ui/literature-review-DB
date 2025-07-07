from fastapi import FastAPI, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import base64
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Assuming you have these imports already
# from your_database import get_db, Project
# from your_models import Project

app = FastAPI()

# You'll update this CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"]
)

@app.get("/api/projects/{project_slug}")
async def get_project(project_slug: str, db: Session = Depends(get_db)):
    """Get project details"""
    logger.info(f"Fetching project: {project_slug}")
    
    project = db.query(Project).filter(Project.slug == project_slug).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Return project data (adjust fields as needed)
    return {
        "id": project.id,
        "slug": project.slug,
        "title": project.title,
        "description": project.description,
        "has_document": bool(project.document_data),
        "document_filename": project.document_filename if project.document_data else None,
        # Add other fields as needed
    }

@app.get("/api/projects/{project_slug}/download")
async def download_project_document(project_slug: str, db: Session = Depends(get_db)):
    """Download project document"""
    logger.info(f"📁 Serving download from database for project: {project_slug}")
    
    # Fetch project from database
    project = db.query(Project).filter(Project.slug == project_slug).first()
    
    if not project:
        logger.error(f"Project not found: {project_slug}")
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.document_data:
        logger.error(f"No document found for project: {project_slug}")
        raise HTTPException(status_code=404, detail="No document found for this project")
    
    # Decode the base64 data
    try:
        file_data = base64.b64decode(project.document_data)
        logger.info(f"Successfully decoded document for project: {project_slug}, size: {len(file_data)} bytes")
    except Exception as e:
        logger.error(f"Failed to decode document for project {project_slug}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decode document")
    
    # Determine content type and filename
    filename = project.document_filename or f"{project_slug}_document"
    content_type = get_content_type(filename)
    
    logger.info(f"Serving file: {filename} with content-type: {content_type}")
    
    # Return file with attachment disposition to force download
    return Response(
        content=file_data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": content_type,
            "Content-Length": str(len(file_data)),
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/api/projects/{project_slug}/view-document")
async def view_project_document(project_slug: str, db: Session = Depends(get_db)):
    """Serve document for inline viewing in browser"""
    logger.info(f"📄 Serving document for viewing: {project_slug}")
    
    # Fetch project from database
    project = db.query(Project).filter(Project.slug == project_slug).first()
    
    if not project:
        logger.error(f"Project not found: {project_slug}")
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.document_data:
        logger.error(f"No document found for project: {project_slug}")
        raise HTTPException(status_code=404, detail="No document found for this project")
    
    # Decode the base64 data
    try:
        file_data = base64.b64decode(project.document_data)
        logger.info(f"Successfully decoded document for viewing: {project_slug}, size: {len(file_data)} bytes")
    except Exception as e:
        logger.error(f"Failed to decode document for project {project_slug}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decode document")
    
    # Determine content type and filename
    filename = project.document_filename or f"{project_slug}_document"
    content_type = get_content_type(filename)
    
    logger.info(f"Serving file for viewing: {filename} with content-type: {content_type}")
    
    # Return file with inline disposition for viewing in browser
    return Response(
        content=file_data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Content-Type": content_type,
            "Content-Length": str(len(file_data)),
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN"
        }
    )

@app.get("/api/projects/{project_slug}/file-info")
async def get_project_file_info(project_slug: str, db: Session = Depends(get_db)):
    """Get information about the project document"""
    logger.info(f"Getting file info for project: {project_slug}")
    
    # Fetch project from database
    project = db.query(Project).filter(Project.slug == project_slug).first()
    
    if not project:
        logger.error(f"Project not found: {project_slug}")
        raise HTTPException(status_code=404, detail="Project not found")
    
    has_document = bool(project.document_data)
    file_size = 0
    
    if has_document:
        try:
            file_size = len(base64.b64decode(project.document_data))
        except Exception as e:
            logger.error(f"Failed to calculate file size for project {project_slug}: {str(e)}")
            file_size = 0
    
    response_data = {
        "available": has_document,
        "filename": project.document_filename if has_document else None,
        "size": file_size,
        "size_formatted": format_file_size(file_size) if has_document else None,
        "content_type": get_content_type(project.document_filename) if has_document and project.document_filename else None
    }
    
    logger.info(f"File info for {project_slug}: {response_data}")
    return response_data

def get_content_type(filename: str) -> str:
    """Determine content type based on file extension"""
    if not filename:
        return "application/octet-stream"
    
    filename_lower = filename.lower()
    
    # Common document types
    if filename_lower.endswith('.pdf'):
        return "application/pdf"
    elif filename_lower.endswith('.doc'):
        return "application/msword"
    elif filename_lower.endswith('.docx'):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename_lower.endswith('.xls'):
        return "application/vnd.ms-excel"
    elif filename_lower.endswith('.xlsx'):
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif filename_lower.endswith('.ppt'):
        return "application/vnd.ms-powerpoint"
    elif filename_lower.endswith('.pptx'):
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    
    # Image types
    elif filename_lower.endswith(('.jpg', '.jpeg')):
        return "image/jpeg"
    elif filename_lower.endswith('.png'):
        return "image/png"
    elif filename_lower.endswith('.gif'):
        return "image/gif"
    elif filename_lower.endswith('.bmp'):
        return "image/bmp"
    elif filename_lower.endswith('.svg'):
        return "image/svg+xml"
    
    # Text types
    elif filename_lower.endswith('.txt'):
        return "text/plain"
    elif filename_lower.endswith('.csv'):
        return "text/csv"
    elif filename_lower.endswith('.html'):
        return "text/html"
    elif filename_lower.endswith('.xml'):
        return "application/xml"
    elif filename_lower.endswith('.json'):
        return "application/json"
    
    # Archive types
    elif filename_lower.endswith('.zip'):
        return "application/zip"
    elif filename_lower.endswith('.rar'):
        return "application/x-rar-compressed"
    elif filename_lower.endswith('.7z'):
        return "application/x-7z-compressed"
    elif filename_lower.endswith('.tar'):
        return "application/x-tar"
    elif filename_lower.endswith('.gz'):
        return "application/gzip"
    
    # Default
    else:
        return "application/octet-stream"

def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

# Optional: Add a health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-viewer"}

# Optional: List all projects with documents
@app.get("/api/projects")
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    has_document: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all projects with optional filtering"""
    query = db.query(Project)
    
    if has_document is not None:
        if has_document:
            query = query.filter(Project.document_data.isnot(None))
        else:
            query = query.filter(Project.document_data.is_(None))
    
    total = query.count()
    projects = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "projects": [
            {
                "id": p.id,
                "slug": p.slug,
                "title": p.title,
                "has_document": bool(p.document_data),
                "document_filename": p.document_filename if p.document_data else None
            }
            for p in projects
        ]
    }
