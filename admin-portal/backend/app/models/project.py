from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
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
    
    # Database File Storage Fields
    document_filename = Column(String, nullable=True)
    document_size = Column(Integer, nullable=True)
    document_data = Column(LargeBinary, nullable=True)
    document_content_type = Column(String, nullable=True)
    document_storage = Column(String, default="database")
    
    # Image Gallery Fields (DEPRECATED - kept for migration)
    images = Column(JSON, default=list, nullable=True)
    featured_image_index = Column(Integer, default=0, nullable=True)
    
    # Stats
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    # User Relationship
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_by_user = relationship("User", back_populates="created_projects")
    
    # Relationship to images stored in database
    image_records = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan", order_by="ProjectImage.order_index")


class ProjectImage(BaseModel):
    __tablename__ = "project_images"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to project
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Image metadata
    filename = Column(String, nullable=False)
    content_type = Column(String, default="image/png")
    image_size = Column(Integer, nullable=True)
    
    # Image data stored in database
    image_data = Column(LargeBinary, nullable=False)
    
    # Order and featured status
    order_index = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship back to project
    project = relationship("Project", back_populates="image_records")
