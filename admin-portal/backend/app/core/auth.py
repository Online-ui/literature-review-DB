from fastapi import APIRouter, Depends, HTTPException, status, Form, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User
from app.core.security import verify_password, get_password_hash
from app.core.config import settings
from app.core.email import send_reset_email
from app.schemas.user import UserResponse

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Token creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Get current user from token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            print("Invalid token - no username extracted")
            raise credentials_exception
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user

# Get current active admin user
async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "main_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Don't redirect on failure - let the frontend handle it.
    """
    # Authenticate user
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Return 401 error without any redirect
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    # Return user data with token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "institution": user.institution,
            "department": user.department,
            "phone": user.phone,
            "profile_image": user.profile_image,
            "about": user.about,
            "disciplines": user.disciplines,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.post("/logout")
async def logout(response: Response):
    """
    Logout endpoint - frontend should handle the redirect
    """
    # The frontend will handle clearing the token and redirecting
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.post("/forgot-password")
async def forgot_password(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    # Send reset email
    try:
        await send_reset_email(user.email, reset_token)
    except Exception as e:
        print(f"Failed to send reset email: {e}")
        # Don't reveal email sending failed to user
    
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user or user.has_reset_token_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password and clear token
    user.hashed_password = get_password_hash(new_password)
    user.clear_reset_token()
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/verify-reset-token")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify if reset token is valid"""
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user or user.has_reset_token_expired():
        return {"valid": False}
    
    return {
        "valid": True,
        "email": user.email,
        "username": user.username
    }

# Health check endpoints
@router.get("/check-auth")
async def check_auth(current_user: User = Depends(get_current_user)):
    """Check if user is authenticated"""
    return {"authenticated": True, "user": current_user.username}

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Example protected route"""
    return {"message": f"Hello {current_user.username}, this is a protected route"}

@router.get("/admin-only")
async def admin_only_route(current_user: User = Depends(get_current_admin_user)):
    """Example admin-only route"""
    return {"message": f"Hello admin {current_user.username}"}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth"}
