from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any

from ..database import get_db
from ..core.auth import get_current_active_user
from ..core.config import settings
from ..models.user import User

router = APIRouter()

@router.get("/constants")
async def get_constants(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """Get all predefined constants for forms"""
    try:
        from ..core.constants import RESEARCH_AREAS, DEGREE_TYPES, ACADEMIC_YEARS, INSTITUTIONS
        return {
            "research_areas": RESEARCH_AREAS,
            "degree_types": DEGREE_TYPES,
            "academic_years": ACADEMIC_YEARS,
            "institutions": INSTITUTIONS
        }
    except ImportError:
        return {
            "research_areas": ["Computer Science", "Engineering", "Medicine"],
            "degree_types": ["Bachelor", "Master", "PhD"],
            "academic_years": ["2023", "2024", "2025"],
            "institutions": ["University A", "University B"]
        }

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
    
    total_users = db.query(User).count()
    
    return {
        "system": {
            "version": settings.VERSION,
            "project_name": settings.PROJECT_NAME,
            "storage_backend": settings.STORAGE_BACKEND
        },
        "database": {
            "total_users": total_users
        }
    }

@router.get("/health-check")
async def health_check(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Simple health check"""
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return {
        "status": "healthy",
        "message": "System is working correctly"
    }
