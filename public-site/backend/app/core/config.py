from pydantic_settings import BaseSettings
from typing import Optional, List, Union
import json

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
    
    # CORS Settings
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "https://literature-public-frontend.onrender.com"
    ]
    
    # API Settings
    API_V1_STR: str = "/api"
    
    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS_ORIGINS if it's a string (from env var)
        if isinstance(self.CORS_ORIGINS, str):
            # Try to parse as JSON first
            try:
                self.CORS_ORIGINS = json.loads(self.CORS_ORIGINS)
            except json.JSONDecodeError:
                # If not JSON, try comma-separated
                if "," in self.CORS_ORIGINS:
                    self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
                else:
                    # Single origin
                    self.CORS_ORIGINS = [self.CORS_ORIGINS.strip()]
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

settings = Settings()
