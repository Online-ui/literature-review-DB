import sys
import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import random

# Database setup
DATABASE_URL = "postgresql://postgres:your_password@localhost/literature_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Simple Project model
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    abstract = Column(Text)
    research_area = Column(String)
    author_name = Column(String, nullable=False)
    institution = Column(String)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Create tables
Base.metadata.create_all(bind=engine)

def create_simple_sample():
    db = SessionLocal()
    
    try:
        project = Project(
            title="Sample Research Project",
            slug="sample-research-project",
            abstract="This is a sample research project for testing the database.",
            research_area="Computer Science",
            author_name="John Doe",
            institution="Sample University",
            is_published=True
        )
        
        db.add(project)
        db.commit()
        print("✅ Simple sample project created!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_sample()