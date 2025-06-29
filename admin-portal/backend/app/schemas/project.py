from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    keywords: Optional[str] = None
    research_area: Optional[str] = None
    degree_type: Optional[str] = None
    academic_year: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    supervisor: Optional[str] = None
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    is_published: Optional[bool] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    slug: str
    is_published: bool
    publication_date: datetime
    view_count: int
    download_count: int
    document_url: Optional[str] = None
    document_filename: Optional[str] = None
    document_size: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

