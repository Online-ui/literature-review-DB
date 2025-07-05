from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List

from ..database import get_db
from ..core.constants import RESEARCH_AREAS, DEGREE_TYPES, ACADEMIC_YEARS, INSTITUTIONS
from ..core.auth import get_current_active_user
from ..models.user import User

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
