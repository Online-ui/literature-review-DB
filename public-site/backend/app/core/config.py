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
    SITE_URL: str = "https://uhas-research-hub.onrender.com"
    
    # File Upload (Legacy - kept for backward compatibility)
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # Supabase Storage Settings
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None  # For admin operations
    SUPABASE_BUCKET_NAME: str = "project-documents"
    
    # Storage Backend
    STORAGE_BACKEND: str = "supabase"  # "local" or "supabase"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @property
    def has_supabase(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_ANON_KEY)

settings = Settings()
