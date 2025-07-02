from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from datetime import datetime

router = APIRouter()

@router.get("/sitemap.xml")
async def generate_sitemap(db: Session = Depends(get_db)):
    base_url = "https://uhas-research-hub.onrender.com/"  
    
    # Get all published projects
    projects = db.query(Project).filter(Project.is_published == True).all()
    
    sitemap_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{base_url}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{base_url}/projects</loc>
        <lastmod>{today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>'''.format(base_url=base_url, today=datetime.now().strftime('%Y-%m-%d'))
        # Add project URLs
    for project in projects:
        sitemap_xml += f'''
    <url>
        <loc>{base_url}/projects/{project.slug}</loc>
        <lastmod>{project.updated_at.strftime('%Y-%m-%d') if project.updated_at else project.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>'''
    
    sitemap_xml += '''
</urlset>'''
    
    return Response(content=sitemap_xml, media_type="application/xml")

@router.get("/robots.txt")
async def robots_txt():
    robots_content = """User-agent: *
Allow: /
Allow: /projects/
Allow: /projects/*

Disallow: /admin/
Disallow: /api/

Sitemap: https://uhas-research-hub.onrender.com//sitemap.xml
"""
    return Response(content=robots_content, media_type="text/plain")
