import fitz  # PyMuPDF
import io
from PIL import Image
import hashlib
from typing import List, Optional
import asyncio

class DocumentImageExtractor:
    def __init__(self, image_upload_service):
        self.image_upload_service = image_upload_service
        self.min_image_size = (100, 100)  # Minimum width/height to consider
        self.min_file_size = 5 * 1024  # Minimum 5KB file size
        
    async def extract_images_from_document(
        self, 
        document_data: bytes, 
        filename: str,
        project_id: int
    ) -> List[str]:
        """Extract images from PDF document"""
        if not filename.lower().endswith('.pdf'):
            return []
            
        try:
            # Open PDF from bytes
            pdf_document = fitz.open(stream=document_data, filetype="pdf")
            extracted_paths = []
            seen_hashes = set()  # Track unique images
            
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    try:
                        # Extract image
                        xref = img[0]
                        pix = fitz.Pixmap(pdf_document, xref)
                        
                        # Convert to PIL Image
                        if pix.n - pix.alpha < 4:  # GRAY or RGB
                            img_data = pix.tobytes("png")
                        else:  # CMYK
                            pix = fitz.Pixmap(fitz.csRGB, pix)
                            img_data = pix.tobytes("png")
                        
                        # Check image size
                        if len(img_data) < self.min_file_size:
                            print(f"Skipping small image: {len(img_data)} bytes")
                            continue
                        
                        # Open with PIL to check dimensions and content
                        pil_image = Image.open(io.BytesIO(img_data))
                        
                        # Skip small images (likely icons or form elements)
                        if (pil_image.width < self.min_image_size[0] or 
                            pil_image.height < self.min_image_size[1]):
                            print(f"Skipping small image: {pil_image.width}x{pil_image.height}")
                            continue
                        
                        # Calculate image hash to avoid duplicates
                        img_hash = hashlib.md5(img_data).hexdigest()
                        if img_hash in seen_hashes:
                            print(f"Skipping duplicate image")
                            continue
                        seen_hashes.add(img_hash)
                        
                        # Check if image is mostly uniform (likely a form element)
                        if self._is_uniform_image(pil_image):
                            print(f"Skipping uniform/form element image")
                            continue
                        
                        # Save image
                        temp_filename = f"page_{page_num + 1}_img_{img_index + 1}.png"
                        
                        # Create a file-like object for upload
                        from fastapi import UploadFile
                        file_obj = io.BytesIO(img_data)
                        file_obj.seek(0)
                        
                        upload_file = UploadFile(
                            file=file_obj,
                            filename=temp_filename
                        )
                        
                        # Save using image service
                        saved_path = await self.image_upload_service.save_image(
                            upload_file, 
                            f"project_{project_id}"
                        )
                        
                        # Add /uploads/ prefix for consistency
                        extracted_paths.append(f"/uploads/{saved_path}")
                        
                    except Exception as e:
                        print(f"Failed to extract image {img_index} from page {page_num}: {e}")
                        continue
                    finally:
                        if 'pix' in locals():
                            pix = None
            
            pdf_document.close()
            print(f"Successfully extracted {len(extracted_paths)} images from {filename}")
            return extracted_paths
            
        except Exception as e:
            print(f"Failed to extract images from document: {e}")
            return []
    
    def _is_uniform_image(self, image: Image.Image, threshold: float = 0.95) -> bool:
        """Check if image is mostly uniform (like a solid color or simple shape)"""
        try:
            # Convert to grayscale for analysis
            gray = image.convert('L')
            
            # Get histogram
            histogram = gray.histogram()
            
            # Find the dominant color
            max_count = max(histogram)
            total_pixels = sum(histogram)
            
            # If more than threshold of pixels are the same color, it's likely uniform
            if max_count / total_pixels > threshold:
                return True
            
            # Additional check: calculate standard deviation
            import numpy as np
            img_array = np.array(gray)
            std_dev = np.std(img_array)
            
            # Low standard deviation indicates uniform image
            if std_dev < 10:
                return True
                
            return False
        except:
            return False
