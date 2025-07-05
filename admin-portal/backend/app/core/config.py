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
    
    # File Upload
    UPLOAD_DIR: str = "../../shared/uploads"
    MAX_FILE_SIZE: int = 52428800
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".doc", ".docx", ".txt", ".rtf"]
    
    # Cloudinary Settings
    CLOUDINARY_CLOUD_NAME: str = "dtwnjeonj"
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    CLOUDINARY_URL: Optional[str] = None  # Can use this OR individual keys
    
    # Storage Backend
    STORAGE_BACKEND: str = "local"  # "local" or "cloudinary"
    
    # Admin Portal
    PROJECT_NAME: str = "Literature Review Database - Admin Portal"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Admin portal for managing literature review database"
    ADMIN_SITE_URL: str = "https://admin.literature-db.com"
    
    # CORS - Add localhost:3001
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
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
        
        # Parse Cloudinary URL if provided
        if self.CLOUDINARY_URL and not self.CLOUDINARY_API_KEY:
            try:
                # Parse cloudinary://api_key:api_secret@cloud_name
                parts = self.CLOUDINARY_URL.replace("cloudinary://", "").split("@")
                if len(parts) == 2:
                    key_secret = parts[0].split(":")
                    if len(key_secret) == 2:
                        self.CLOUDINARY_API_KEY = key_secret[0]
                        self.CLOUDINARY_API_SECRET = key_secret[1]
            except:
                pass
        
        # Auto-enable Cloudinary if credentials are present
        if self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET:
            self.STORAGE_BACKEND = "cloudinary"
    
    @property
    def has_cloudinary(self) -> bool:
        return bool(self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)

settings = Settings()
