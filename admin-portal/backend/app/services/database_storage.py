from fastapi import UploadFile, HTTPException
import os
from typing import Dict, Any, Optional
from ..core.config import settings

class DatabaseStorageService:
    def __init__(self):
        """Initialize Database Storage Service"""
        print("✅ Database Storage initialized")
    
    async def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "projects", 
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process file for database storage
        
        Args:
            file: FastAPI UploadFile object
            folder: Not used for database storage (kept for compatibility)
            filename: Not used for database storage (kept for compatibility)
            
        Returns:
            Dict with file information for database storage
        """
        try:
            # Validate file
            await self._validate_file(file)
            
            # Read file content
            file_content = await file.read()
            file_size = len(file_content)
            
            print(f"📁 Processing file for database storage: {file.filename} ({file_size / 1024 / 1024:.2f} MB)")
            
            # Return file data for database storage
            result = {
                "filename": file.filename,
                "size": file_size,
                "data": file_content,  # Raw bytes to store in database
                "content_type": file.content_type or "application/octet-stream",
                "storage": "database"
            }
            
            print(f"✅ File processed for database storage: {file.filename}")
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            error_msg = f"File processing failed for {file.filename}: {str(e)}"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
    
    async def _validate_file(self, file: UploadFile) -> None:
        """Validate file before processing"""
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_extension} not allowed. Allowed: {', '.join(settings.ALLOWED_FILE_TYPES)}"
            )
        
        # Check file size
        current_pos = file.file.tell()
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(current_pos)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {file_size / 1024 / 1024:.1f}MB. Max: {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
            )
    
    async def delete_file(self, file_id: str) -> bool:
        """
        Delete file from database storage
        Note: Actual deletion happens in the database layer
        """
        print(f"🗑️  File deletion handled by database layer for: {file_id}")
        return True
    
    def get_file_url(self, project_id: int) -> str:
        """Get download URL for a database-stored file"""
        return f"/api/projects/{project_id}/download"
    
    def health_check(self) -> Dict[str, Any]:
        """Check health of database storage"""
        return {
            "status": "healthy",
            "storage": "database",
            "max_file_size_mb": settings.MAX_FILE_SIZE / 1024 / 1024,
            "allowed_types": settings.ALLOWED_FILE_TYPES
        }

# Initialize service
database_storage = DatabaseStorageService()
