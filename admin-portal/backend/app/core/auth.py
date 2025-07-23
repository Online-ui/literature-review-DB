from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
import secrets
import string

from ..database import get_db
from ..models.user import User
from ..core.security import verify_password, get_password_hash, create_access_token, verify_token
from ..core.config import settings

router = APIRouter()
security = HTTPBearer()

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class PasswordResetResponse(BaseModel):
    message: str

class TokenVerificationResponse(BaseModel):
    valid: bool
    email: str
    username: str

def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

# Authentication dependency functions
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        username = verify_token(credentials.credentials)
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user

def require_main_coordinator(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.is_main_coordinator:  # Use the new property
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Main coordinator access required."
        )
    return current_user

# Authentication endpoints
@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint that accepts form data"""
    # Check if user exists by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "institution": user.institution,
            "department": user.department,
            "phone": user.phone,
            "about": user.about,                    # Added
            "disciplines": user.disciplines,        # Added
            "profile_image": user.profile_image,    # Added
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset token"""
    print(f"🔐 Password reset requested for email: {request.email}")
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success message to prevent email enumeration
    if not user:
        print(f"❌ No user found with email: {request.email}")
        return {"message": "If the email exists in our system, you will receive a password reset email shortly."}
    
    # Generate reset token
    reset_token = generate_reset_token()
    
    # Save token and expiration to database
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=30)  # 30 minutes expiry
    db.commit()

    print(f"✅ Reset token generated for user: {user.username}")
    print(f"🔗 Reset token: {reset_token}")  # Remove this in production
    print(f"📧 Reset URL would be: {settings.FRONTEND_URL}/reset-password?token={reset_token}")

    # TODO: Send reset email here
    # try:
    #     await send_reset_password_email(
    #         email=user.email,
    #         token=reset_token,
    #         username=user.username
    #     )
    # except Exception as e:
    #     print(f"Error sending email: {str(e)}")
    
    return {"message": "If the email exists in our system, you will receive a password reset email shortly."}

@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password using token"""
    print(f"🔐 Password reset attempt with token: {request.token}")
    
    # Find user by reset token
    user = db.query(User).filter(User.reset_token == request.token).first()
    
    if not user:
        print(f"❌ Invalid reset token: {request.token}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Check if token has expired using the helper method
    if user.has_reset_token_expired():
        print(f"⏰ Expired reset token for user: {user.username}")
        user.clear_reset_token()
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Validate password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.clear_reset_token()  # Use helper method
    db.commit()
    
    print(f"✅ Password reset successful for user: {user.username}")
    
    # TODO: Send confirmation email
    # try:
    #     await send_password_reset_confirmation(
    #         email=user.email,
    #         username=user.username
    #     )
    # except Exception as e:
    #     print(f"Error sending confirmation email: {str(e)}")
    
    return {"message": "Password has been successfully reset. You can now login with your new password."}

@router.get("/verify-reset-token", response_model=TokenVerificationResponse)
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify if a reset token is valid - GET endpoint for easy browser testing"""
    print(f"🔍 Verifying reset token: {token}")
    
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user:
        print(f"❌ Invalid token: {token}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Check if token has expired using the helper method
    if user.has_reset_token_expired():
        print(f"⏰ Expired token for user: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    print(f"✅ Valid token for user: {user.username}")
    
    return TokenVerificationResponse(
        valid=True,
        email=user.email,
        username=user.username
    )

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "institution": current_user.institution,
        "department": current_user.department,
        "phone": current_user.phone,
        "about": current_user.about,                    # Added
        "disciplines": current_user.disciplines,        # Added
        "profile_image": current_user.profile_image,    # Added
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """Logout endpoint (client should remove token)"""
    return {"message": "Successfully logged out"}

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.get("/protected")
async def protected_route(
    current_user: User = Depends(get_current_active_user)
):
    """Example protected route"""
    return {
        "message": f"Hello {current_user.username}, this is a protected route!",
        "user_role": current_user.role
    }

@router.get("/admin-only")
async def admin_only_route(
    current_user: User = Depends(require_main_coordinator)
):
    """Example admin-only route"""
    return {
        "message": f"Hello {current_user.username}, you have main coordinator access!",
        "user_role": current_user.role
    }
