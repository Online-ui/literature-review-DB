from pydantic_settings import BaseSettings
from typing import List, Union, Optional
import json

class Settings(BaseSettings):
    # Database - Same as public site
    DATABASE_URL: str
    
    # Admin Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # File Upload - Database Storage
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB for database storage
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".doc", ".docx", ".txt", ".rtf"]
    
    # Storage Backend
    STORAGE_BACKEND: str = "database"  # Always database now
    
    # Admin Portal
    PROJECT_NAME: str = "Literature Review Database - Admin Portal"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Admin portal for managing literature review database"
    ADMIN_SITE_URL: str = "https://admin.literature-db.com"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "https://uhas-research-hub.onrender.com",
        "https://admin.literature-db.com"
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS_ORIGINS if it's a string
        if isinstance(self.CORS_ORIGINS, str):
            try:
                self.CORS_ORIGINS = json.loads(self.CORS_ORIGINS)
            except json.JSONDecodeError:
                if "," in self.CORS_ORIGINS:
                    self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
                else:
                    self.CORS_ORIGINS = [self.CORS_ORIGINS.strip()]

settings = Settings()
