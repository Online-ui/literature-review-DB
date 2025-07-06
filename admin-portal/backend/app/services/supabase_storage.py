from supabase import create_client, Client
from fastapi import UploadFile, HTTPException
import os
import uuid
from typing import Dict, Any, Optional
from ..core.config import settings

class SupabaseStorageService:
    def __init__(self):
        if not settings.has_supabase:
            raise ValueError("Supabase credentials not configured")
        
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
        self.bucket_name = settings.SUPABASE_BUCKET_NAME
        
        # Initialize bucket if it doesn't exist
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists"""
        try:
            # Try to get bucket info
            self.supabase.storage.get_bucket(self.bucket_name)
        except Exception:
            # Bucket doesn't exist, create it
            try:
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={"public": True}
                )
                print(f"✅ Created Supabase bucket: {self.bucket_name}")
            except Exception as e:
                print(f"⚠️  Could not create bucket {self.bucket_name}: {str(e)}")
    
    async def upload_file(self, file: UploadFile, folder: str = "projects", filename: Optional[str] = None) -> Dict[str, Any]:
        """Upload file to Supabase Storage"""
        try:
            # Read file content
            file_content = await file.read()
            
            # Generate filename if not provided
            if not filename:
                file_extension = os.path.splitext(file.filename)[1] if file.filename else '.pdf'
                filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create full path
            file_path = f"{folder}/{filename}"
            
            # Upload to Supabase
            result = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": file.content_type or "application/octet-stream",
                    "upsert": True  # Allow overwriting
                }
            )
            
            # Check if upload was successful
            if hasattr(result, 'status_code') and result.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Upload failed: {result}")
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            
            return {
                "path": file_path,
                "url": public_url,
                "size": len(file_content),
                "content_type": file.content_type or "application/octet-stream",
                "storage": "supabase"
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Supabase Storage"""
        try:
            result = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            return len(result) > 0
        except Exception as e:
            print(f"Error deleting file {file_path}: {str(e)}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        return self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
    
    def list_files(self, folder: str = "") -> list:
        """List files in a folder"""
        try:
            result = self.supabase.storage.from_(self.bucket_name).list(folder)
            return result
        except Exception as e:
            print(f"Error listing files in {folder}: {str(e)}")
            return []

# Initialize service
try:
    supabase_storage = SupabaseStorageService()
except Exception as e:
    print(f"⚠️  Supabase Storage not initialized: {str(e)}")
    supabase_storage = None
