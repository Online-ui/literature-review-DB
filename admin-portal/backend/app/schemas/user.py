from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, ForwardRef
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    institution: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    role: str = "faculty"
    profile_image: Optional[str] = None
    
    @validator('username')
    def username_must_be_valid(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v
    
    @validator('role')
    def role_must_be_valid(cls, v):
        if v not in ['faculty', 'main_coordinator']:
            raise ValueError('Role must be either "faculty" or "main_coordinator"')
        return v

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    profile_image: Optional[str] = None
    
    @validator('role')
    def role_must_be_valid(cls, v):
        if v is not None and v not in ['faculty', 'main_coordinator']:
            raise ValueError('Role must be either "faculty" or "main_coordinator"')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    project_count: Optional[int] = 0  # Number of projects created by user
    
    class Config:
        from_attributes = True

# Forward reference for circular import
ProjectResponse = ForwardRef('ProjectResponse')

class UserWithProjects(UserResponse):
    """User response with their projects included"""
    projects: List[ProjectResponse] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserStats(BaseModel):
    """User statistics schema"""
    total_users: int
    active_users: int
    faculty_count: int
    coordinator_count: int
    recent_registrations: int
