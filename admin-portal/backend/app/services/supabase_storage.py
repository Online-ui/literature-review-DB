from supabase import create_client, Client
from fastapi import UploadFile, HTTPException
import os
import uuid
import io
import asyncio
from typing import Dict, Any, Optional
from ..core.config import settings

class SupabaseStorageService:
    def __init__(self):
        if not settings.has_supabase:
            raise ValueError("Supabase credentials not configured")
        
        try:
            # Create client with custom timeout
            self.supabase: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY,
                options={
                    "storage": {
                        "timeout": 60000  # 60 seconds timeout
                    }
                }
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
            result = self.supabase.storage.from_(self.bucket_name).list(limit=1)
            print(f"✅ Bucket '{self.bucket_name}' is accessible")
            return True
        except Exception as e:
            print(f"⚠️  Bucket access test failed: {str(e)}")
            return False
    
    async def upload_file(self, file: UploadFile, folder: str = "projects", filename: Optional[str] = None, max_retries: int = 3) -> Dict[str, Any]:
        """Upload file to Supabase Storage with retry logic"""
        
        # Check file size first
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        print(f"📁 File size: {file_size_mb:.2f} MB")
        
        # If file is too large, reject it
        if len(file_content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024 * 1024):.1f}MB"
            )
        
        # Generate filename if not provided
        if not filename:
            file_extension = os.path.splitext(file.filename)[1] if file.filename else '.pdf'
            filename = f"{uuid.uuid4()}{file_extension}"
        
        file_path = f"{folder}/{filename}"
        
        # Retry upload with exponential backoff
        for attempt in range(max_retries):
            try:
                print(f"🔄 Upload attempt {attempt + 1}/{max_retries} for: {file.filename}")
                
                # Use asyncio.wait_for to add timeout
                upload_task = self._upload_with_timeout(file_content, file_path, file.content_type)
                result = await asyncio.wait_for(upload_task, timeout=30.0)  # 30 second timeout
                
                # Get public URL
                public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
                print(f"✅ Upload successful! URL: {public_url}")
                
                return {
                    "path": file_path,
                    "url": public_url,
                    "size": len(file_content),
                    "content_type": file.content_type or "application/octet-stream",
                    "storage": "supabase"
                }
                
            except asyncio.TimeoutError:
                print(f"⏰ Upload attempt {attempt + 1} timed out")
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=408,
                        detail="File upload timed out. Please try with a smaller file or check your connection."
                    )
                # Wait before retry (exponential backoff)
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                print(f"❌ Upload attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"File upload failed after {max_retries} attempts: {str(e)}"
                    )
                # Wait before retry
                await asyncio.sleep(2 ** attempt)
    
    async def _upload_with_timeout(self, file_content: bytes, file_path: str, content_type: str):
        """Internal upload method with proper async handling"""
        try:
            # Method 1: Direct upload with bytes
            print("🔄 Trying direct bytes upload...")
            result = self.supabase.storage.from_(self.bucket_name).upload(
                file_path,
                file_content,
                {
                    "content-type": content_type or "application/octet-stream",
                    "upsert": True
                }
            )
            return result
            
        except Exception as e1:
            print(f"❌ Direct upload failed: {e1}")
            
            # Method 2: Upload with BytesIO
            print("🔄 Trying BytesIO upload...")
            file_obj = io.BytesIO(file_content)
            result = self.supabase.storage.from_(self.bucket_name).upload(
                file_path,
                file_obj,
                {
                    "content-type": content_type or "application/octet-stream",
                    "upsert": True
                }
            )
            return result
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Supabase Storage"""
        try:
            print(f"🗑️  Deleting file: {file_path}")
            result = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            success = len(result) > 0 if result else False
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
