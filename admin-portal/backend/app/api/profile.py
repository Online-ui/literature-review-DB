from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.image_upload import ImageUploadService

# Add logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the image upload service for profiles
profile_image_service = ImageUploadService(upload_dir="uploads/profile_images")

# Profile update schema
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    about: Optional[str] = None
    disciplines: Optional[str] = None

@router.post("/image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Upload or replace profile image"""
    # Delete existing image if any
    if current_user.profile_image:
        try:
            await profile_image_service.delete_image(current_user.profile_image)
        except Exception:
            pass
    
    try:
        # Save image and get the relative path
        path = await profile_image_service.save_image(file, f"user_{current_user.id}")
        
        # Store the full relative path including user directory
        full_relative_path = f"user_{current_user.id}/{path}" if not path.startswith(f"user_{current_user.id}") else path
        
        current_user.profile_image = full_relative_path
        db.commit()
        
        return {
            "image_url": f"/api/uploads/profile_images/{full_relative_path}",
            "path": full_relative_path
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/image")
async def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Delete profile image"""
    if current_user.profile_image:
        try:
            await profile_image_service.delete_image(current_user.profile_image)
            current_user.profile_image = None
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))
    
    return {"message": "Profile image deleted successfully"}

@router.put("")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update user profile information"""
    try:
        # Log incoming data
        logger.info(f"Updating profile for user {current_user.id}")
        logger.info(f"Update data: {profile_data.dict(exclude_unset=True)}")
        
        # Update only provided fields
        update_data = profile_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
                logger.info(f"Set {field} = {value}")
        
        db.commit()
        db.refresh(current_user)
        
        # Log what we're returning
        response_data = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "institution": current_user.institution,
            "department": current_user.department,
            "phone": current_user.phone,
            "about": current_user.about,
            "disciplines": current_user.disciplines,
            "profile_image": current_user.profile_image,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
        
        logger.info(f"Returning response: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def get_profile(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current user's profile"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "institution": current_user.institution,
        "department": current_user.department,
        "phone": current_user.phone,
        "about": current_user.about,
        "disciplines": current_user.disciplines,
        "profile_image": current_user.profile_image,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.get("/debug")
async def debug_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Debug endpoint to check current database values"""
    # Refresh from database
    db.refresh(current_user)
    
    return {
        "database_values": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "institution": current_user.institution,
            "department": current_user.department,
            "phone": current_user.phone,
            "about": current_user.about,
            "disciplines": current_user.disciplines,
            "profile_image": current_user.profile_image,
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/image/debug")
async def debug_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Debug profile image paths"""
    import os
    from pathlib import Path
    
    base_dir = Path(__file__).resolve().parent.parent
    upload_dir = base_dir / "uploads" / "profile_images"
    
    user_images = []
    if upload_dir.exists():
        user_dir = upload_dir / f"user_{current_user.id}"
        if user_dir.exists():
            user_images = [f.name for f in user_dir.iterdir() if f.is_file()]
    
    return {
        "current_profile_image": current_user.profile_image,
        "upload_dir_exists": upload_dir.exists(),
        "user_dir": str(upload_dir / f"user_{current_user.id}"),
        "user_dir_exists": (upload_dir / f"user_{current_user.id}").exists(),
        "images_in_user_dir": user_images,
        "full_path": str(upload_dir / current_user.profile_image) if current_user.profile_image else None,
        "file_exists": (upload_dir / current_user.profile_image).exists() if current_user.profile_image else False
    }
