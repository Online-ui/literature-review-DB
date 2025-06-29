from pydantic import BaseModel, HttpUrl
from typing import Optional, List
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

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    slug: str
    is_published: bool
    publication_date: datetime
    view_count: int
    download_count: int
    document_url: Optional[str] = None
    document_filename: Optional[str] = None
    meta_description: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProjectSummary(BaseModel):
    """Lightweight project info for listings"""
    id: int
    title: str
    slug: str
    abstract: Optional[str] = None
    research_area: Optional[str] = None
    degree_type: Optional[str] = None
    institution: Optional[str] = None
    author_name: str
    publication_date: datetime
    view_count: int
    
    class Config:
        from_attributes = True

class SearchFilters(BaseModel):
    query: Optional[str] = None
    research_area: Optional[str] = None
    degree_type: Optional[str] = None
    institution: Optional[str] = None
    academic_year: Optional[str] = None
    
class SearchResponse(BaseModel):
    projects: List[ProjectSummary]
    total: int
    page: int
    per_page: int
    total_pages: int
    filters: SearchFilters