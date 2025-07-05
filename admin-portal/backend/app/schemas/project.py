from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    keywords: Optional[str] = None
    research_area: Optional[str] = None
    custom_research_area: Optional[str] = None  # New field for custom research area
    degree_type: Optional[str] = None
    custom_degree_type: Optional[str] = None  # New field for custom degree type
    academic_year: Optional[str] = None
    institution: Optional[str] = None
    custom_institution: Optional[str] = None  # New field for custom institution
    department: Optional[str] = None
    supervisor: Optional[str] = None
    author_name: str
    author_email: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

class ProjectCreate(ProjectBase):
    @validator('research_area')
    def validate_research_area(cls, v, values):
        if v == "Others" and not values.get('custom_research_area'):
            raise ValueError('Custom research area is required when "Others" is selected')
        return v
    
    @validator('degree_type')
    def validate_degree_type(cls, v, values):
        if v == "Others" and not values.get('custom_degree_type'):
            raise ValueError('Custom degree type is required when "Others" is selected')
        return v
    
    @validator('institution')
    def validate_institution(cls, v, values):
        if v == "Others" and not values.get('custom_institution'):
            raise ValueError('Custom institution is required when "Others" is selected')
        return v

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    keywords: Optional[str] = None
    research_area: Optional[str] = None
    custom_research_area: Optional[str] = None
    degree_type: Optional[str] = None
    custom_degree_type: Optional[str] = None
    academic_year: Optional[str] = None
    institution: Optional[str] = None
    custom_institution: Optional[str] = None
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
