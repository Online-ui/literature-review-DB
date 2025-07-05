import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import os
from typing import Dict, Optional, BinaryIO
from fastapi import UploadFile
import aiofiles
from app.core.config import settings

class StorageService:
    def __init__(self):
        if settings.has_cloudinary:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
    
    async def upload_file(self, file: UploadFile, folder: str = "documents") -> Dict:
        """Upload file to storage backend"""
        if settings.STORAGE_BACKEND == "cloudinary":
            return await self._upload_to_cloudinary(file, folder)
        else:
            return await self._upload_to_local(file)
    
    async def _upload_to_cloudinary(self, file: UploadFile, folder: str) -> Dict:
        """Upload file to Cloudinary"""
        try:
            # Read file content
            content = await file.read()
            
            # Reset file position
            await file.seek(0)
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                resource_type="raw",  # For non-image files like PDFs
                folder=f"literature-hub/{folder}",
                public_id=f"{file.filename.rsplit('.', 1)[0]}_{os.urandom(4).hex()}",
                overwrite=True,
                notification_url=None
            )
            
            return {
                "url": result['secure_url'],
                "public_id": result['public_id'],
                "size": result['bytes'],
                "format": result.get('format', file.filename.split('.')[-1]),
                "storage": "cloudinary"
            }
        except Exception as e:
            raise Exception(f"Cloudinary upload failed: {str(e)}")
    
    async def _upload_to_local(self, file: UploadFile) -> Dict:
        """Upload file to local storage"""
        try:
            # Create upload directory if it doesn't exist
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            
            # Generate unique filename
            filename = f"{file.filename.rsplit('.', 1)[0]}_{os.urandom(4).hex()}.{file.filename.split('.')[-1]}"
            file_path = os.path.join(settings.UPLOAD_DIR, filename)
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            return {
                "url": f"/uploads/{filename}",
                "public_id": filename,
                "size": len(content),
                "format": file.filename.split('.')[-1],
                "storage": "local"
            }
        except Exception as e:
            raise Exception(f"Local upload failed: {str(e)}")
    
    async def delete_file(self, public_id: str, storage_type: str = None) -> bool:
        """Delete file from storage"""
        storage = storage_type or settings.STORAGE_BACKEND
        
        if storage == "cloudinary":
            try:
                result = cloudinary.uploader.destroy(public_id, resource_type="raw")
                return result['result'] == 'ok'
            except:
                return False
        else:
            try:
                # For local storage, public_id is the filename
                file_path = os.path.join(settings.UPLOAD_DIR, public_id)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    return True
                return False
            except:
                return False
    
    def get_file_url(self, public_id: str, storage_type: str = None) -> Optional[str]:
        """Get file URL"""
        storage = storage_type or settings.STORAGE_BACKEND
        
        if storage == "cloudinary":
            url, _ = cloudinary_url(public_id, resource_type="raw", secure=True)
            return url
        else:
            return f"/api/files/{public_id}"

# Create singleton instance
storage_service = StorageService()
