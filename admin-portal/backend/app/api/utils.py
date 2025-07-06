from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any

from ..database import get_db
from ..core.constants import RESEARCH_AREAS, DEGREE_TYPES, ACADEMIC_YEARS, INSTITUTIONS
from ..core.auth import get_current_active_user
from ..core.config import settings
from ..models.user import User
from ..models.project import Project

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
            "unpublished_projects": total_projects - published_projects
        },
        "storage": {
            "backend": settings.STORAGE_BACKEND,
            "supabase_configured": settings.has_supabase if settings.STORAGE_BACKEND == "supabase" else None,
            "bucket_name": settings.SUPABASE_BUCKET_NAME if settings.STORAGE_BACKEND == "supabase" else None
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
    
    if settings.STORAGE_BACKEND == "supabase":
        try:
            from ..services.supabase_storage import supabase_storage
            if supabase_storage:
                # Try to list files to test connection
                files = supabase_storage.list_files("projects")
                return {
                    "status": "success",
                    "backend": "supabase",
                    "bucket": settings.SUPABASE_BUCKET_NAME,
                    "file_count": len(files) if files else 0,
                    "message": "Supabase storage connection successful"
                }
            else:
                return {
                    "status": "error",
                    "backend": "supabase",
                    "message": "Supabase storage not initialized"
                }
        except Exception as e:
            return {
                "status": "error",
                "backend": "supabase",
                "message": f"Supabase connection failed: {str(e)}"
            }
    
    elif settings.STORAGE_BACKEND == "local":
        import os
        try:
            # Check if upload directory exists and is writable
            upload_dir = settings.UPLOAD_DIR
            if os.path.exists(upload_dir):
                # Count files in upload directory
                file_count = len([f for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))])
                return {
                    "status": "success",
                    "backend": "local",
                    "upload_dir": upload_dir,
                    "file_count": file_count,
                    "message": "Local storage accessible"
                }
            else:
                return {
                    "status": "warning",
                    "backend": "local",
                    "upload_dir": upload_dir,
                    "message": "Upload directory does not exist"
                }
        except Exception as e:
            return {
                "status": "error",
                "backend": "local",
                "message": f"Local storage error: {str(e)}"
            }
    
    return {
        "status": "unknown",
        "backend": settings.STORAGE_BACKEND,
        "message": f"Unknown storage backend: {settings.STORAGE_BACKEND}"
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
        "timestamp": "2024-01-01T00:00:00Z",  # Will be set by the API
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
    storage_test = await test_storage(current_user)
    health_status["checks"]["storage"] = {
        "status": "healthy" if storage_test["status"] == "success" else "unhealthy",
        "message": storage_test["message"],
        "backend": storage_test["backend"]
    }
    
    if storage_test["status"] != "success":
        health_status["overall_status"] = "degraded"
    
    # Configuration check
    config_issues = []
    if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key":
        config_issues.append("SECRET_KEY not properly configured")
    
    if settings.STORAGE_BACKEND == "supabase" and not settings.has_supabase:
        config_issues.append("Supabase credentials missing")
    
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
    
    total_files = db.query(Project).filter(Project.document_filename.isnot(None)).count()
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
    
    # Get storage backend distribution
    storage_backends = db.query(
        Project.document_storage,
        func.count().label('count')
    ).filter(
        Project.document_storage.isnot(None)
    ).group_by(
        Project.document_storage
    ).all()
    
    return {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / 1024 / 1024, 2) if total_size else 0,
        "file_types": [{"extension": ext, "count": count} for ext, count in file_types],
        "storage_backends": [{"backend": backend, "count": count} for backend, count in storage_backends],
        "average_file_size_mb": round((total_size / total_files) / 1024 / 1024, 2) if total_files > 0 else 0
    }
