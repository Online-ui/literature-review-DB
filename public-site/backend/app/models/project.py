from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func, LargeBinary, JSON
from . import Base  # Import Base from __init__.py

class Project(Base):
    __tablename__ = "projects"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
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
    
    # Stats
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    # Image fields
    images = Column(JSON, nullable=True, default=list)
    featured_image_index = Column(Integer, default=0)
    
    # User Relationship (simplified for public site)
    created_by_id = Column(Integer, nullable=True)
