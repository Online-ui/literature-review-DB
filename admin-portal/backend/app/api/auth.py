from fastapi import APIRouter, Depends
from ..core.auth import get_current_active_user
from ..models.user import User

router = APIRouter()

@router.get("/constants")
async def get_constants(current_user: User = Depends(get_current_active_user)):
    return {"message": "Constants endpoint working"}

@router.get("/health-check")
async def health_check(current_user: User = Depends(get_current_active_user)):
    return {"status": "healthy", "message": "System is working"}
