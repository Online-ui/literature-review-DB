import io
import os
import uuid
from pathlib import Path
from typing import List, Dict, Optional
import tempfile

class DocumentImageExtractor:
    def __init__(self, image_service):
        self.image_service = image_service
        self.temp_dir = Path(tempfile.gettempdir()) / "temp_extractions"
        self.temp_dir.mkdir(exist_ok=True)
    
    async def extract_images_from_document(self, document_data: bytes, filename: str, project_id: int) -> List[str]:
        """Extract images from document and return list of saved image paths"""
        file_ext = Path(filename).suffix.lower()
        
        if file_ext == '.pdf':
            return await self._extract_from_pdf(document_data, project_id)
        elif file_ext in ['.docx', '.doc']:
            return await self._extract_from_docx(document_data, project_id)
        else:
            return []
    
    async def _extract_from_pdf(self, pdf_data: bytes, project_id: int) -> List[str]:
        """Extract images from PDF"""
        image_paths = []
        
        try:
            import fitz  # PyMuPDF
            
            # Open PDF from bytes
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
            
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    try:
                        # Extract image
                        xref = img[0]
                        base_image = pdf_document.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Save to temporary file
                        temp_filename = f"pdf_p{page_num}_img{img_index}.{base_image['ext']}"
                        temp_path = self.temp_dir / temp_filename
                        
                        with open(temp_path, "wb") as f:
                            f.write(image_bytes)
                        
                        # Create a mock UploadFile object
                        from fastapi import UploadFile
                        with open(temp_path, "rb") as f:
                            upload_file = UploadFile(
                                filename=temp_filename,
                                file=f
                            )
                            # Save using image service
                            saved_path = await self.image_service.save_image(
                                upload_file, 
                                f"project_{project_id}"
                            )
                            # Return the full path that matches what the frontend expects
                            image_paths.append(f"/uploads/{saved_path}")
                        
                        # Clean up temp file
                        if temp_path.exists():
                            temp_path.unlink()
                    except Exception as e:
                        print(f"Failed to extract image {img_index} from page {page_num}: {e}")
                        continue
            
            pdf_document.close()
            
        except ImportError:
            print("PyMuPDF not installed. Cannot extract images from PDF.")
        except Exception as e:
            print(f"Error extracting images from PDF: {e}")
        
        return image_paths
    
    async def _extract_from_docx(self, docx_data: bytes, project_id: int) -> List[str]:
        """Extract images from DOCX"""
        image_paths = []
        
        try:
            import zipfile
            
            # Save to temporary file
            temp_docx = self.temp_dir / f"temp_{uuid.uuid4()}.docx"
            with open(temp_docx, "wb") as f:
                f.write(docx_data)
            
            # Open as zip to extract images
            with zipfile.ZipFile(temp_docx, 'r') as docx_zip:
                # Images are stored in word/media/
                for file_info in docx_zip.filelist:
                    if file_info.filename.startswith('word/media/'):
                        try:
                            # Extract image
                            image_data = docx_zip.read(file_info.filename)
                            
                            # Get file extension
                            ext = Path(file_info.filename).suffix
                            temp_filename = f"docx_{Path(file_info.filename).stem}{ext}"
                            temp_path = self.temp_dir / temp_filename
                            
                            # Save temporarily
                            with open(temp_path, "wb") as f:
                                f.write(image_data)
                            
                            # Create mock UploadFile
                            from fastapi import UploadFile
                            with open(temp_path, "rb") as f:
                                upload_file = UploadFile(
                                    filename=temp_filename,
                                    file=f
                                )
                                # Save using image service
                                saved_path = await self.image_service.save_image(
                                    upload_file,
                                    f"project_{project_id}"
                                )
                                # Return the full path that matches what the frontend expects
                                image_paths.append(f"/uploads/{saved_path}")
                            
                            # Clean up
                            if temp_path.exists():
                                temp_path.unlink()
                        except Exception as e:
                            print(f"Failed to extract image {file_info.filename}: {e}")
                            continue
            
            # Clean up temp docx
            if temp_docx.exists():
                temp_docx.unlink()
            
        except Exception as e:
            print(f"Error extracting images from DOCX: {e}")
        
        return image_paths
