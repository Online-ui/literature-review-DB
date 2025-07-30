from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectImageResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    content_type: str
    order_index: int
    is_featured: bool
    image_size: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    keywords: Optional[str] = None
    research_area: Optional[str] = None
    degree_type: Optional[str] = None
    academic_year: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    supervisor: Optional[str] = None
    author_name: str
    author_email: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    slug: str
    is_published: bool
    publication_date: datetime
    view_count: int
    download_count: int
    
    # Legacy image fields
    images: Optional[List[str]] = []
    featured_image_index: Optional[int] = 0
    
    # New image records
    image_records: List[ProjectImageResponse] = []
    
    # Database Storage Fields
    document_filename: Optional[str] = None
    document_size: Optional[int] = None
    document_content_type: Optional[str] = None
    document_storage: Optional[str] = None
    
    # Metadata
    created_by_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        orm_mode = True

class ProjectStats(BaseModel):
    """Schema for project statistics"""
    total_projects: int
    total_institutions: int
    total_research_areas: int
    total_downloads: int
    total_views: int = 0

class ProjectFileInfo(BaseModel):
    """Schema for file information responses"""
    filename: Optional[str] = None
    size: Optional[int] = None
    content_type: Optional[str] = None
    storage: Optional[str] = None
    download_count: int = 0
    view_count: int = 0
    available: bool = False
