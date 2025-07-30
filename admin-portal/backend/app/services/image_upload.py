import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
import aiofiles
from PIL import Image
import io

class ImageUploadService:
    def __init__(self, upload_dir: str = "uploads"):
        # Determine the correct base directory based on environment
        if os.environ.get('RENDER'):
            # On Render, use the absolute path
            self.base_dir = Path('/opt/render/project/src/admin-portal/backend/app')
        else:
            # Locally, use relative path
            self.base_dir = Path(__file__).resolve().parent.parent  # Go up to app directory
        
        self.upload_dir = self.base_dir / upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.max_dimensions = (4000, 4000)  # Max width/height
        
        print(f"ImageUploadService initialized:")
        print(f"  - Environment: {'Render' if os.environ.get('RENDER') else 'Local'}")
        print(f"  - Base dir: {self.base_dir}")
        print(f"  - Upload dir: {self.upload_dir}")
        print(f"  - Upload dir exists: {self.upload_dir.exists()}")

    async def save_image(self, file: UploadFile, prefix: str = "") -> str:
        """Save uploaded image and return the path"""
        # Validate file
        await self._validate_image(file)
        
        # Generate unique filename
        ext = Path(file.filename).suffix.lower()
        filename = f"{uuid.uuid4()}{ext}"
        
        # Create user-specific directory
        if prefix:
            save_dir = self.upload_dir / prefix
            save_dir.mkdir(parents=True, exist_ok=True)
            relative_path = f"{prefix}/{filename}"
        else:
            save_dir = self.upload_dir
            relative_path = filename
            
        filepath = save_dir / filename
        
        print(f"Saving image to: {filepath}")
        
        # Save file
        async with aiofiles.open(filepath, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Verify file was saved
        if not filepath.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file at {filepath}"
            )
        
        # Optimize image
        await self._optimize_image(filepath)
        
        print(f"Image saved successfully:")
        print(f"  - Full path: {filepath}")
        print(f"  - Relative path: {relative_path}")
        print(f"  - File exists: {filepath.exists()}")
        print(f"  - File size: {filepath.stat().st_size} bytes")
        
        # Return relative path from uploads directory
        return relative_path

    async def delete_image(self, path: str) -> None:
        """Delete an image file"""
        if not path:
            return
            
        # Clean up the path
        clean_path = path
        
        # Remove various prefixes that might be present
        prefixes_to_remove = [
            '/api/uploads/profile_images/',
            'api/uploads/profile_images/',
            '/api/uploads/',
            'api/uploads/',
            '/uploads/profile_images/',
            'uploads/profile_images/',
            '/uploads/',
            'uploads/',
            '/profile_images/',
            'profile_images/',
            '/'
        ]
        
        for prefix in prefixes_to_remove:
            if clean_path.startswith(prefix):
                clean_path = clean_path[len(prefix):]
                break
        
        # Construct the full path
        filepath = self.upload_dir / clean_path
        
        print(f"Delete image request:")
        print(f"  - Original path: {path}")
        print(f"  - Clean path: {clean_path}")
        print(f"  - Full path: {filepath}")
        print(f"  - File exists: {filepath.exists()}")
        
        if filepath.exists() and filepath.is_file():
            filepath.unlink()
            print(f"  - Status: Deleted successfully")
        else:
            # Try with profile_images subdirectory if not found
            alt_filepath = self.upload_dir / 'profile_images' / clean_path
            if alt_filepath.exists() and alt_filepath.is_file():
                alt_filepath.unlink()
                print(f"  - Status: Deleted from alt path: {alt_filepath}")
            else:
                print(f"  - Status: File not found")

    async def _validate_image(self, file: UploadFile) -> None:
        """Validate uploaded image"""
        # Check extension
        ext = Path(file.filename).suffix.lower()
        if ext not in self.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(self.allowed_extensions)}"
            )
        
        # Check file size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > self.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {self.max_file_size // 1024 // 1024}MB"
            )
        
        # Validate it's actually an image
        try:
            content = await file.read()
            image = Image.open(io.BytesIO(content))
            
            # Check dimensions
            if image.width > self.max_dimensions[0] or image.height > self.max_dimensions[1]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image dimensions too large. Maximum: {self.max_dimensions[0]}x{self.max_dimensions[1]}"
                )
            
            # Reset file position
            file.file.seek(0)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail="Invalid image file"
            )

    async def _optimize_image(self, filepath: Path) -> None:
        """Optimize image for web use"""
        try:
            with Image.open(filepath) as img:
                # Convert RGBA to RGB if necessary
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])
                    img = background
                
                # Resize if too large
                max_size = 2000
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Save optimized image
                img.save(filepath, optimize=True, quality=85)
                
                print(f"Image optimized: {filepath}")
        except Exception as e:
            # If optimization fails, keep original
            print(f"Warning: Failed to optimize image {filepath}: {e}")
            pass

    def get_full_path(self, relative_path: str) -> Path:
        """Get the full path for a relative path"""
        return self.upload_dir / relative_path
    
    def path_exists(self, relative_path: str) -> bool:
        """Check if a file exists at the given relative path"""
        full_path = self.get_full_path(relative_path)
        exists = full_path.exists() and full_path.is_file()
        print(f"Path check: {relative_path} -> {full_path} -> Exists: {exists}")
        return exists
