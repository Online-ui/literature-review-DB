from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    # Authentication
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    
    # Profile
    full_name = Column(String, nullable=False)
    institution = Column(String)
    department = Column(String)
    phone = Column(String)
    
    # Role & Status
    role = Column(String, default="faculty")  # "main_coordinator", "faculty"
    is_active = Column(Boolean, default=True)
    
    # Password Reset
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Relationships
    created_projects = relationship("Project", back_populates="created_by_user")
