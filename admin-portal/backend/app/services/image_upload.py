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
        # Use absolute path
        self.base_dir = Path(__file__).resolve().parent.parent  # Go up to app directory
        self.upload_dir = self.base_dir / upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.max_dimensions = (4000, 4000)  # Max width/height
        
        print(f"ImageUploadService initialized with upload_dir: {self.upload_dir}")

    async def save_image(self, file: UploadFile, subfolder: Optional[str] = None) -> str:
        """Save uploaded image and return the path"""
        # Validate file
        await self._validate_image(file)
        
        # Generate unique filename
        ext = Path(file.filename).suffix.lower()
        filename = f"{uuid.uuid4()}{ext}"
        
        # Create subfolder if specified
        if subfolder:
            save_dir = self.upload_dir / "projects" / subfolder
            save_dir.mkdir(parents=True, exist_ok=True)
            relative_path = f"projects/{subfolder}/{filename}"
        else:
            save_dir = self.upload_dir / "projects"
            save_dir.mkdir(parents=True, exist_ok=True)
            relative_path = f"projects/{filename}"
            
        filepath = save_dir / filename
        
        print(f"Saving image to: {filepath}")
        
        # Save file
        async with aiofiles.open(filepath, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Optimize image
        await self._optimize_image(filepath)
        
        print(f"Image saved successfully, returning path: {relative_path}")
        
        # Return relative path from uploads directory
        return relative_path

    async def delete_image(self, path: str) -> None:
        """Delete an image file"""
        # Remove leading slash if present
        if path.startswith('/'):
            path = path[1:]
        
        # Remove 'uploads/' prefix if present
        if path.startswith('uploads/'):
            path = path[8:]
            
        filepath = self.upload_dir / path
        print(f"Attempting to delete: {filepath}")
        
            if filepath.exists() and filepath.is_file():
            filepath.unlink()
            print(f"Deleted successfully")
        else:
            print(f"File not found: {filepath}")

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
        except Exception as e:
            # If optimization fails, keep original
            print(f"Warning: Failed to optimize image {filepath}: {e}")
            pass
