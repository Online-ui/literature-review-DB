from sqlalchemy.ext.declarative import declarative_base

# Create Base here
Base = declarative_base()

# Import models after Base is created
from .project import Project

__all__ = ["Base", "Project"]
