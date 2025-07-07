from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sys
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
engine = create_engine(DATABASE_URL)
Base = declarative_base()

app = FastAPI(
    title="Literature Review Database",
    version="1.0.0",
    description="Discover and explore academic research projects"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://uhas-research-hub.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
try:
    # Define Project model inline to avoid import issues
    from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func, LargeBinary
    
    class Project(Base):
        __tablename__ = "projects"
        
        id = Column(Integer, primary_key=True, index=True)
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
        created_by_id = Column(Integer, nullable=True)
    
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️  Database setup warning: {e}")

# Database dependency
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Define API routes inline
from fastapi import Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import io
from pydantic import BaseModel
from datetime import datetime

# Pydantic models
class ProjectResponse(BaseModel):
    id: int
    title: str
    slug: str
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
    is_published: bool
    publication_date: datetime
    view_count: int
    download_count: int
    document_filename: Optional[str] = None
    document_size: Optional[int] = None
    document_content_type: Optional[str] = None
    document_storage: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# API Routes
@app.get("/api/projects/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    research_area: Optional[str] = None,
    degree_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.is_published == True)
    
    if search:
        query = query.filter(
            or_(
                Project.title.ilike(f"%{search}%"),
                Project.abstract.ilike(f"%{search}%"),
                Project.author_name.ilike(f"%{search}%"),
                Project.keywords.ilike(f"%{search}%")
            )
        )
    
    if research_area:
        query = query.filter(Project.research_area == research_area)
    
    if degree_type:
        query = query.filter(Project.degree_type == degree_type)
    
    projects = query.offset(skip).limit(limit).all()
    return projects

@app.get("/api/projects/featured", response_model=List[ProjectResponse])
async def get_featured_projects(limit: int = 6, db: Session = Depends(get_db)):
    projects = db.query(Project).filter(
        Project.is_published == True
    ).order_by(Project.view_count.desc()).limit(limit).all()
    return projects

@app.get("/api/projects/stats")
async def get_site_stats(db: Session = Depends(get_db)):
    total_projects = db.query(Project).filter(Project.is_published == True).count()
    total_institutions = db.query(func.count(func.distinct(Project.institution))).filter(
        Project.is_published == True,
        Project.institution.isnot(None)
    ).scalar()
    total_research_areas = db.query(func.count(func.distinct(Project.research_area))).filter(
        Project.is_published == True,
        Project.research_area.isnot(None)
    ).scalar()
    total_downloads = db.query(func.sum(Project.download_count)).filter(
        Project.is_published == True
    ).scalar() or 0
    total_views = db.query(func.sum(Project.view_count)).filter(
        Project.is_published == True
    ).scalar() or 0
    
    return {
        "total_projects": total_projects,
        "total_institutions": total_institutions,
        "total_research_areas": total_research_areas,
        "total_downloads": total_downloads,
        "total_views": total_views
    }

@app.get("/api/projects/research-areas/list")
async def get_research_areas(db: Session = Depends(get_db)):
    areas = db.query(Project.research_area).filter(
        Project.research_area.isnot(None),
        Project.is_published == True
    ).distinct().all()
    return [area[0] for area in areas if area[0]]

@app.get("/api/projects/institutions/list")
async def get_institutions(db: Session = Depends(get_db)):
    institutions = db.query(Project.institution).filter(
        Project.institution.isnot(None),
        Project.is_published == True
    ).distinct().all()
    return [inst[0] for inst in institutions if inst[0]]

@app.get("/api/projects/{slug}", response_model=ProjectResponse)
async def get_project(slug: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Increment view count
    project.view_count = (project.view_count or 0) + 1
    db.commit()
    
    return project

@app.get("/api/projects/{slug}/view-document")
async def view_document(slug: str, db: Session = Depends(get_db)):
    """View project document in browser"""
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.document_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document available"
        )
    
    return StreamingResponse(
        io.BytesIO(project.document_data),
        media_type=project.document_content_type or "application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=\"{project.document_filename}\"",
            "Content-Type": project.document_content_type or "application/pdf",
        }
    )

@app.get("/api/projects/{slug}/download")
async def download_document(slug: str, db: Session = Depends(get_db)):
    """Download project document from database"""
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.is_published == True
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.document_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document available for download"
        )
    
    # Increment download count
    project.download_count = (project.download_count or 0) + 1
    db.commit()
    
    return StreamingResponse(
        io.BytesIO(project.document_data),
        media_type=project.document_content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename=\"{project.document_filename}\""
        }
    )

# Root endpoints
@app.get("/")
async def root():
    return {
        "message": "Welcome to Literature Review Database",
        "version": "1.0.0",
        "storage_backend": "database",
        "api_docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "storage_backend": "database"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
