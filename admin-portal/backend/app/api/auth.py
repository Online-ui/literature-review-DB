from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, List, Any

from ..database import get_db
from ..core.constants import RESEARCH_AREAS, DEGREE_TYPES, ACADEMIC_YEARS, INSTITUTIONS
from ..core.auth import get_current_active_user
from ..core.config import settings
from ..models.user import User
from ..models.project import Project
from ..services.database_storage import database_storage

router = APIRouter()

@router.get("/constants")
async def get_constants(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """Get all predefined constants for forms"""
    return {
        "research_areas": RESEARCH_AREAS,
        "degree_types": DEGREE_TYPES,
        "academic_years": ACADEMIC_YEARS,
        "institutions": INSTITUTIONS
    }

@router.get("/research-areas")
async def get_research_areas(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """Get list of research areas"""
    return {"research_areas": RESEARCH_AREAS}

@router.get("/degree-types")
async def get_degree_types(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """Get list of degree types"""
    return {"degree_types": DEGREE_TYPES}

@router.get("/academic-years")
async def get_academic_years(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """Get list of academic years"""
    return {"academic_years": ACADEMIC_YEARS}

@router.get("/institutions")
async def get_institutions(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """Get list of institutions"""
    return {"institutions": INSTITUTIONS}

@router.get("/system-info")
async def get_system_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get system information (admin only)"""
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Get database stats
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_projects = db.query(Project).count()
    published_projects = db.query(Project).filter(Project.is_published == True).count()
    projects_with_files = db.query(Project).filter(Project.document_data.isnot(None)).count()
    
    # Calculate total file storage used
    from sqlalchemy import func
    total_file_size = db.query(func.sum(Project.document_size)).filter(
        Project.document_size.isnot(None)
    ).scalar() or 0
    
    return {
        "system": {
            "version": settings.VERSION,
            "project_name": settings.PROJECT_NAME,
            "storage_backend": settings.STORAGE_BACKEND,
            "max_file_size": settings.MAX_FILE_SIZE,
            "max_file_size_mb": round(settings.MAX_FILE_SIZE / 1024 / 1024, 1),
            "allowed_file_types": settings.ALLOWED_FILE_TYPES
        },
        "database": {
            "total_users": total_users,
            "active_users": active_users,
            "total_projects": total_projects,
            "published_projects": published_projects,
            "unpublished_projects": total_projects - published_projects,
            "projects_with_files": projects_with_files,
            "total_file_size_bytes": total_file_size,
            "total_file_size_mb": round(total_file_size / 1024 / 1024, 2)
        },
        "storage": {
            "backend": settings.STORAGE_BACKEND,
            "type": "database",
            "status": "healthy"
        },
        "constants": {
            "research_areas_count": len(RESEARCH_AREAS),
            "degree_types_count": len(DEGREE_TYPES),
            "academic_years_count": len(ACADEMIC_YEARS),
            "institutions_count": len(INSTITUTIONS)
        }
    }

@router.get("/storage-test")
async def test_storage(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Test storage backend connectivity (admin only)"""
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Test database storage service
        health_check = database_storage.health_check()
        
        return {
            "status": "success",
            "backend": "database",
            "health_check": health_check,
            "message": "Database storage is working correctly"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "backend": "database",
            "message": f"Database storage error: {str(e)}"
        }

@router.post("/test-upload")
async def test_file_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Test file upload processing (admin only)"""
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Test file processing
        result = await database_storage.upload_file(file)
        
        return {
            "success": True,
            "message": "File processed successfully",
            "file_info": {
                "filename": result["filename"],
                "size_bytes": result["size"],
                "size_mb": round(result["size"] / 1024 / 1024, 2),
                "content_type": result["content_type"],
                "storage": result["storage"]
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        return {
            "success": False,
            "message": f"File processing failed: {str(e)}"
        }

@router.get("/health-check")
async def health_check(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Comprehensive health check (admin only)"""
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    health_status = {
        "overall_status": "healthy",
        "timestamp": "",
        "checks": {}
    }
    
    # Database check
    try:
        db.execute("SELECT 1")
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
        health_status["overall_status"] = "unhealthy"
    
    # Storage check
    try:
        storage_health = database_storage.health_check()
        health_status["checks"]["storage"] = {
            "status": "healthy",
            "message": "Database storage working correctly",
            "details": storage_health
        }
    except Exception as e:
        health_status["checks"]["storage"] = {
            "status": "unhealthy",
            "message": f"Storage check failed: {str(e)}"
        }
        health_status["overall_status"] = "degraded"
    
    # Configuration check
    config_issues = []
    if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key":
        config_issues.append("SECRET_KEY not properly configured")
    
    if settings.MAX_FILE_SIZE > 50 * 1024 * 1024:  # Warn if over 50MB
        config_issues.append("MAX_FILE_SIZE is very large for database storage")
    
    health_status["checks"]["configuration"] = {
        "status": "healthy" if not config_issues else "warning",
        "message": "Configuration OK" if not config_issues else f"Issues: {', '.join(config_issues)}",
        "issues": config_issues
    }
    
    if config_issues:
        health_status["overall_status"] = "degraded"
    
    # Set timestamp
    from datetime import datetime
    health_status["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    return health_status

@router.get("/file-stats")
async def get_file_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get file storage statistics (admin only)"""
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Get file statistics from database
    from sqlalchemy import func
    
    total_files = db.query(Project).filter(Project.document_data.isnot(None)).count()
    total_size = db.query(func.sum(Project.document_size)).filter(Project.document_size.isnot(None)).scalar() or 0
    
    # Get file type distribution
    file_types = db.query(
        func.lower(func.right(Project.document_filename, 4)).label('extension'),
        func.count().label('count')
    ).filter(
        Project.document_filename.isnot(None)
    ).group_by(
        func.lower(func.right(Project.document_filename, 4))
    ).all()
    
    # Get largest files
    largest_files = db.query(
        Project.document_filename,
        Project.document_size,
        Project.title
    ).filter(
        Project.document_size.isnot(None)
    ).order_by(
        Project.document_size.desc()
    ).limit(5).all()
    
    return {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / 1024 / 1024, 2) if total_size else 0,
        "total_size_gb": round(total_size / 1024 / 1024 / 1024, 3) if total_size else 0,
        "file_types": [{"extension": ext, "count": count} for ext, count in file_types],
        "largest_files": [
            {
                "filename": filename,
                "size_mb": round(size / 1024 / 1024, 2) if size else 0,
                "project_title": title
            }
            for filename, size, title in largest_files
        ],
        "average_file_size_mb": round((total_size / total_files) / 1024 / 1024, 2) if total_files > 0 else 0,
        "storage_backend": "database"
    }
