from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.project import Project
from ..core.auth import get_current_active_user

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get basic counts
    total_projects = db.query(Project).count()
    published_projects = db.query(Project).filter(Project.is_published == True).count()
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Get total downloads and views
    total_downloads = db.query(func.sum(Project.download_count)).scalar() or 0
    total_views = db.query(func.sum(Project.view_count)).scalar() or 0
    
    # Get recent projects
    recent_projects = db.query(Project).order_by(Project.created_at.desc()).limit(5).all()
    
    # Get projects by research area
    research_areas = db.query(
        Project.research_area,
        func.count(Project.id).label('count')
    ).filter(
        Project.research_area.isnot(None)
    ).group_by(Project.research_area).all()
    
    return {
        "total_projects": total_projects,
        "published_projects": published_projects,
        "draft_projects": total_projects - published_projects,
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_downloads": total_downloads,
        "total_views": total_views,
        "recent_projects": [
            {
                "id": p.id,
                "title": p.title,
                "author_name": p.author_name,
                "created_at": p.created_at,
                "is_published": p.is_published
            } for p in recent_projects
        ],
        "research_areas": [
            {"name": area, "count": count} for area, count in research_areas
        ]
    }

@router.get("/activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get recent projects
    recent_projects = db.query(Project).order_by(Project.created_at.desc()).limit(10).all()
    
    # Get recent users
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    
    return {
        "recent_projects": [
            {
                "id": p.id,
                "title": p.title,
                "author_name": p.author_name,
                "created_at": p.created_at,
                "type": "project"
            } for p in recent_projects
        ],
        "recent_users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "username": u.username,
                "created_at": u.created_at,
                "type": "user"
            } for u in recent_users
        ]
    }