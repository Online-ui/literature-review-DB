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
        
        try:
            self.supabase: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
            self.bucket_name = settings.SUPABASE_BUCKET_NAME
            
            # Test bucket access
            self._test_bucket_access()
            print(f"✅ Supabase Storage initialized with bucket: {self.bucket_name}")
            
        except Exception as e:
            print(f"❌ Supabase Storage initialization failed: {str(e)}")
            raise e
    
    def _test_bucket_access(self):
        """Test if bucket exists and is accessible"""
        try:
            # Try to list files in bucket
            result = self.supabase.storage.from_(self.bucket_name).list(limit=1)
            print(f"✅ Bucket '{self.bucket_name}' is accessible")
            return True
        except Exception as e:
            print(f"⚠️  Bucket access test failed: {str(e)}")
            # Try to create bucket if it doesn't exist
            try:
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={"public": True}
                )
                print(f"✅ Created bucket '{self.bucket_name}'")
                return True
            except Exception as create_error:
                print(f"❌ Could not create bucket: {str(create_error)}")
                return False
    
    async def upload_file(self, file: UploadFile, folder: str = "projects", filename: Optional[str] = None) -> Dict[str, Any]:
        """Upload file to Supabase Storage"""
        try:
            print(f"🔄 Starting file upload: {file.filename}")
            
            # Read file content
            file_content = await file.read()
            print(f"📁 File size: {len(file_content)} bytes")
            
            # Reset file position for potential re-reading
            await file.seek(0)
            
            # Generate filename if not provided
            if not filename:
                file_extension = os.path.splitext(file.filename)[1] if file.filename else '.pdf'
                filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create full path
            file_path = f"{folder}/{filename}"
            print(f"📂 Upload path: {file_path}")
            
            # Upload to Supabase
            print(f"☁️  Uploading to Supabase bucket: {self.bucket_name}")
            result = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": file.content_type or "application/octet-stream",
                    "upsert": True  # Allow overwriting
                }
            )
            
            print(f"📤 Upload result: {result}")
            
            # Check if upload was successful
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Upload failed: {result.error}")
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            print(f"🔗 Public URL: {public_url}")
            
            return {
                "path": file_path,
                "url": public_url,
                "size": len(file_content),
                "content_type": file.content_type or "application/octet-stream",
                "storage": "supabase"
            }
            
        except Exception as e:
            error_msg = f"File upload failed: {str(e)}"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Supabase Storage"""
        try:
            print(f"🗑️  Deleting file: {file_path}")
            result = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            success = len(result) > 0
            print(f"✅ Delete successful: {success}")
            return success
        except Exception as e:
            print(f"❌ Error deleting file {file_path}: {str(e)}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        return self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
    
    def list_files(self, folder: str = "") -> list:
        """List files in a folder"""
        try:
            result = self.supabase.storage.from_(self.bucket_name).list(folder, limit=100)
            return result if result else []
        except Exception as e:
            print(f"❌ Error listing files in {folder}: {str(e)}")
            return []

# Initialize service with error handling
try:
    supabase_storage = SupabaseStorageService()
except Exception as e:
    print(f"⚠️  Supabase Storage not initialized: {str(e)}")
    supabase_storage = None
