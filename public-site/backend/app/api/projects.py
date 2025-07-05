from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import os

from ..database import get_db
from ..models.project import Project
from ..schemas.project import ProjectResponse
from ..core.config import settings

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    research_area: Optional[str] = None,
    degree_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.is_published == True)
    
    if search:
        query = query.filter(
            or_(
                Project.title.ilike(f"%{search}%"),
                Project.abstract.ilike(f"%{search}%"),
                Project.author_name.ilike(f"%{search}%"),
                Project.keywords.ilike(f"%{search}%")
            )
        )
    
    if research_area:
        query = query.filter(Project.research_area == research_area)
    
    if degree_type:
        query = query.filter(Project.degree_type == degree_type)
    
    projects = query.offset(skip).limit(limit).all()
    return projects

@router.get("/featured", response_model=List[ProjectResponse])
async def get_featured_projects(limit: int = 6, db: Session = Depends(get_db)):
    projects = db.query(Project).filter(
        Project.is_published == True
    ).order_by(Project.view_count.desc()).limit(limit).all()
    return projects

@router.get("/stats")
async def get_site_stats(db: Session = Depends(get_db)):
    total_projects = db.query(Project).filter(Project.is_published == True).count()
    total_institutions = db.query(func.count(func.distinct(Project.institution))).filter(
        Project.is_published == True,
        Project.institution.isnot(None)
    ).scalar()
    total_research_areas = db.query(func.count(func.distinct(Project.research_area))).filter(
        Project.is_published == True,
        Project.research_area.isnot(None)
    ).scalar()
    total_downloads = db.query(func.sum(Project.download_count)).filter(
        Project.is_published == True
    ).scalar() or 0
    
    return {
        "total_projects": total_projects,
        "total_institutions": total_institutions,
        "total_research_areas": total_research_areas,
        "total_downloads": total_downloads
    }

@router.get("/research-areas/list")
async def get_research_areas(db: Session = Depends(get_db)):
    areas = db.query(Project.research_area).filter(
        Project.research_area.isnot(None),
        Project.is_published == True
    ).distinct().all()
    return [area[0] for area in areas if area[0]]

@router.get("/institutions/list")
async def get_institutions(db: Session = Depends(get_db)):
    institutions = db.query(Project.institution).filter(
        Project.institution.isnot(None),
        Project.is_published == True
    ).distinct().all()
    return [inst[0] for inst in institutions if inst[0]]

@router.get("/{slug}", response_model=ProjectResponse)
async def get_project(slug: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Increment view count
    project.view_count += 1
    db.commit()
    
    return project

@router.post("/{slug}/download")
async def download_project(slug: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.document_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document available for download"
        )
    
    # Increment download count
    project.download_count += 1
    db.commit()
    
    # If using Cloudinary, redirect to Cloudinary URL with download flag
    if project.document_storage == "cloudinary":
        download_url = f"{project.document_url}?fl_attachment"
        return RedirectResponse(url=download_url)
    
    # For local storage, try multiple possible file locations
    possible_paths = [
        # Current directory uploads
        project.document_url.replace("/uploads/", "uploads/"),
        f"uploads/{os.path.basename(project.document_url)}",
        
        # Shared uploads directory
        project.document_url.replace("/uploads/", "../../shared/uploads/"),
        f"../../shared/uploads/{os.path.basename(project.document_url)}",
        
        # Admin portal uploads directory
        project.document_url.replace("/uploads/", "../admin-portal/backend/uploads/"),
        f"../admin-portal/backend/uploads/{os.path.basename(project.document_url)}",
        
        # Absolute path from document_url
        project.document_url.lstrip('/'),
    ]
    
    file_path = None
    for path in possible_paths:
        print(f"Checking path: {path}")  # Debug log
        if os.path.exists(path):
            file_path = path
            print(f"Found file at: {path}")  # Debug log
            break
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document file not found. Searched: {possible_paths}"
        )
    
    return FileResponse(
        path=file_path,
        filename=project.document_filename or f"{project.slug}.pdf",
        media_type='application/octet-stream'
    )

@router.get("/{slug}/view-document")
async def view_document(slug: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.document_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document available"
        )
    
    # If using Cloudinary, redirect to Cloudinary URL
    if project.document_storage == "cloudinary":
        return RedirectResponse(url=project.document_url)
    
    # For local storage, use the same file path logic as download
    possible_paths = [
        # Current directory uploads
        project.document_url.replace("/uploads/", "uploads/"),
        f"uploads/{os.path.basename(project.document_url)}",
        
        # Shared uploads directory
        project.document_url.replace("/uploads/", "../../shared/uploads/"),
        f"../../shared/uploads/{os.path.basename(project.document_url)}",
        
        # Admin portal uploads directory
        project.document_url.replace("/uploads/", "../admin-portal/backend/uploads/"),
        f"../admin-portal/backend/uploads/{os.path.basename(project.document_url)}",
        
        # Absolute path from document_url
        project.document_url.lstrip('/'),
    ]
    
    file_path = None
    for path in possible_paths:
        print(f"Checking view path: {path}")  # Debug log
        if os.path.exists(path):
            file_path = path
            print(f"Found view file at: {path}")  # Debug log
            break
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document file not found for viewing. Searched: {possible_paths}"
        )
    
    # Determine media type based on file extension
    file_extension = os.path.splitext(file_path)[1].lower()
    media_type = "application/pdf" if file_extension == ".pdf" else "application/octet-stream"
    
    return FileResponse(
        path=file_path,
        filename=project.document_filename or f"{project.slug}.pdf",
        media_type=media_type,
        headers={"Content-Disposition": "inline"}  # This makes it display in browser instead of download
    )
