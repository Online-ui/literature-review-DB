from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database - Same as public site
    DATABASE_URL: str
    
    # Admin Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # File Upload
    UPLOAD_DIR: str = "../../shared/uploads"
    MAX_FILE_SIZE: int = 52428800
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".doc", ".docx", ".txt", ".rtf"]
    
    # Admin Portal
    PROJECT_NAME: str = "Literature Review Database - Admin Portal"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Admin portal for managing literature review database"
    ADMIN_SITE_URL: str = "https://admin.literature-db.com"
    
    # CORS - Add localhost:3001
    CORS_ORIGINS: List[str] = [
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "https://admin.literature-db.com"
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()