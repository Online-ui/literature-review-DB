from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any  # Add Any import

from app.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.image_upload import ImageUploadService

router = APIRouter()

# Initialize the image upload service for profiles
profile_image_service = ImageUploadService(upload_dir="uploads/profile_images")

@router.post("/profile/image")
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
            # Continue even if deletion fails
            pass
    
    # Upload new image
    try:
        path = await profile_image_service.save_image(file, f"user_{current_user.id}")
        current_user.profile_image = path
        db.commit()
        
        return {"image_url": f"/uploads/profile_images/{path}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/profile/image")
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

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:  # Changed from 'any' to 'Any'
    """Update user profile information"""
    allowed_fields = ['full_name', 'institution', 'department', 'phone']
    
    for field, value in profile_data.items():
        if field in allowed_fields and hasattr(current_user, field):
            setattr(current_user, field, value)
    
    try:
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "institution": current_user.institution,
                "department": current_user.department,
                "phone": current_user.phone,
                "profile_image": current_user.profile_image,
                "role": current_user.role,
                "is_active": current_user.is_active
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
