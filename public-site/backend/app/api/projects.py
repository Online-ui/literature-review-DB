from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import io

from ..database import get_db
from ..models.project import Project
from ..schemas.project import ProjectResponse, ProjectStats, ProjectFileInfo
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
    total_views = db.query(func.sum(Project.view_count)).filter(
        Project.is_published == True
    ).scalar() or 0
    
    return {
        "total_projects": total_projects,
        "total_institutions": total_institutions,
        "total_research_areas": total_research_areas,
        "total_downloads": total_downloads,
        "total_views": total_views
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
    project.view_count = (project.view_count or 0) + 1
    db.commit()
    
    return project

@router.get("/{slug}/view-document")
async def view_document(slug: str, db: Session = Depends(get_db)):
    """View project document in browser"""
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.document_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document available"
        )
    
    # Return file for inline viewing
    return StreamingResponse(
        io.BytesIO(project.document_data),
        media_type=project.document_content_type or "application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=\"{project.document_filename}\"",
            "Content-Type": project.document_content_type or "application/pdf",
        }
    )

@router.get("/{slug}/download")
async def download_document(slug: str, db: Session = Depends(get_db)):
    """Download project document from database"""
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.document_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document available for download"
        )
    
    # Increment download count
    project.download_count = (project.download_count or 0) + 1
    db.commit()
    
    # Return file as streaming response
    return StreamingResponse(
        io.BytesIO(project.document_data),
        media_type=project.document_content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename=\"{project.document_filename}\""
        }
    )

@router.get("/{slug}/file-info")
async def get_file_info(slug: str, db: Session = Depends(get_db)):
    """Get file information for a project"""
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return ProjectFileInfo(
        filename=project.document_filename,
        size=project.document_size,
        content_type=project.document_content_type,
        storage=project.document_storage,
        download_count=project.download_count or 0,
        view_count=project.view_count or 0,
        available=bool(project.document_data)
    )

# Legacy endpoint for backward compatibility
@router.post("/{slug}/download")
async def download_project_post(slug: str, db: Session = Depends(get_db)):
    """Legacy POST endpoint for download - redirects to GET"""
    return await download_document(slug, db)

@router.patch("/{slug}/increment-view")
async def increment_project_view(slug: str, db: Session = Depends(get_db)):
    """Increment project view counter (for AJAX calls)"""
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Increment view counter
    project.view_count = (project.view_count or 0) + 1
    
    try:
        db.commit()
        return {
            "message": "View count incremented", 
            "view_count": project.view_count,
            "slug": project.slug
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update view count"
        )
