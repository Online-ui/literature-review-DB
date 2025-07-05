from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class Project(BaseModel):
    __tablename__ = "projects"
    
    # Basic Info
    title = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    abstract = Column(Text)
    keywords = Column(Text)
    
    # Academic Details
    research_area = Column(String, index=True)
    degree_type = Column(String)
    academic_year = Column(String)
    institution = Column(String, index=True)
    department = Column(String)
    supervisor = Column(String)
    
    # Author Info
    author_name = Column(String, nullable=False)
    author_email = Column(String)
    
    # Publication Status
    is_published = Column(Boolean, default=True, index=True)
    publication_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # SEO Fields
    meta_description = Column(Text)
    meta_keywords = Column(Text)
    
    # File Info
    document_url = Column(String)
    document_public_id = Column(String, nullable=True)  # For Cloudinary
    document_filename = Column(String)
    document_size = Column(Integer)
    document_storage = Column(String, default="local")  # "local" or "cloudinary"
    
    # Stats
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    # User Relationship
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_by_user = relationship("User", back_populates="created_projects")
