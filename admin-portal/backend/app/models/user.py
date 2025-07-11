from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    # Authentication
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile
    full_name = Column(String(255), nullable=False)
    institution = Column(String(255))
    department = Column(String(255))
    phone = Column(String(20))
    profile_image = Column(String, nullable=True)
    # Role & Status
    role = Column(String(50), default="faculty")  # "main_coordinator", "faculty"
    is_active = Column(Boolean, default=True)
    
    # Password Reset
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Relationships
    created_projects = relationship("Project", back_populates="created_by_user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}', role='{self.role}')>"
    
    @property
    def is_main_coordinator(self):
        """Check if user is a main coordinator"""
        return self.role == "main_coordinator"
    
    @property
    def is_faculty(self):
        """Check if user is faculty"""
        return self.role == "faculty"
    
    def has_reset_token_expired(self):
        """Check if the reset token has expired"""
        if not self.reset_token_expires:
            return True
        from datetime import datetime
        return self.reset_token_expires < datetime.utcnow()
    
    def clear_reset_token(self):
        """Clear the reset token and expiration"""
        self.reset_token = None
        self.reset_token_expires = None
