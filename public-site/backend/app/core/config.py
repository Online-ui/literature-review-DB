from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://username:password@localhost/literature_db"
    
    # App Settings
    PROJECT_NAME: str = "Literature Review Database"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Discover and explore academic research projects and literature reviews"
    
    # SEO
    SITE_URL: str = "https://literature-db.com"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    class Config:
        env_file = ".env"

settings = Settings()