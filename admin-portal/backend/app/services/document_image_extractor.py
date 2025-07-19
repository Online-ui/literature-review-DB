import io
import os
import uuid
from pathlib import Path
from typing import List
import tempfile
from sqlalchemy.orm import Session

from .database_image_service import DatabaseImageService

class DocumentImageExtractor:
    def __init__(self, db_image_service: DatabaseImageService):
        self.db_image_service = db_image_service
        self.min_image_size = 5000  # Minimum 5KB to filter out tiny images
    
    async def extract_images_from_document(
        self, 
        document_data: bytes, 
        filename: str, 
        project_id: int,
        db: Session
    ) -> int:
        """Extract images from document and save to database. Returns count of extracted images."""
        file_ext = Path(filename).suffix.lower()
        
        if file_ext == '.pdf':
            return await self._extract_from_pdf(document_data, project_id, db)
        elif file_ext in ['.docx', '.doc']:
            return await self._extract_from_docx(document_data, project_id, db)
        else:
            return 0
    
    async def _extract_from_pdf(self, pdf_data: bytes, project_id: int, db: Session) -> int:
        """Extract images from PDF and save to database"""
        extracted_count = 0
        
        try:
            import fitz  # PyMuPDF
            
            # Open PDF from bytes
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
            
            # Get current image count for ordering
            from ..models.project import ProjectImage
            current_count = db.query(ProjectImage).filter(ProjectImage.project_id == project_id).count()
            
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    try:
                        # Extract image
                        xref = img[0]
                        base_image = pdf_document.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Skip small images
                        if len(image_bytes) < self.min_image_size:
                            print(f"Skipping small image: {len(image_bytes)} bytes")
                            continue
                        
                        # Generate filename
                        ext = base_image.get('ext', 'png')
                        filename = f"extracted_p{page_num + 1}_img{img_index + 1}.{ext}"
                        
                        # Save to database
                        await self.db_image_service.save_image_bytes_to_db(
                            image_bytes=image_bytes,
                            filename=filename,
                            project_id=project_id,
                            db=db,
                            order_index=current_count + extracted_count,
                            is_featured=(current_count == 0 and extracted_count == 0)
                        )
                        
                        extracted_count += 1
                        
                    except Exception as e:
                        print(f"Failed to extract image {img_index} from page {page_num}: {e}")
                        continue
            
            pdf_document.close()
            print(f"Successfully extracted {extracted_count} images from {filename}")
            
        except ImportError:
            print("PyMuPDF not installed. Cannot extract images from PDF.")
        except Exception as e:
            print(f"Error extracting images from PDF: {e}")
        
        return extracted_count
    
    async def _extract_from_docx(self, docx_data: bytes, project_id: int, db: Session) -> int:
        """Extract images from DOCX and save to database"""
        extracted_count = 0
        
        try:
            import zipfile
            import tempfile
            
            # Get current image count for ordering
            from ..models.project import ProjectImage
            current_count = db.query(ProjectImage).filter(ProjectImage.project_id == project_id).count()
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp_file:
                tmp_file.write(docx_data)
                tmp_path = tmp_file.name
            
            try:
                # Open as zip to extract images
                with zipfile.ZipFile(tmp_path, 'r') as docx_zip:
                    # Images are stored in word/media/
                    for file_info in docx_zip.filelist:
                        if file_info.filename.startswith('word/media/') and not file_info.is_dir():
                            try:
                                # Extract image
                                image_data = docx_zip.read(file_info.filename)
                                
                                # Skip small images
                                if len(image_data) < self.min_image_size:
                                    continue
                                
                                # Get filename
                                filename = Path(file_info.filename).name
                                
                                # Save to database
                                await self.db_image_service.save_image_bytes_to_db(
                                    image_bytes=image_data,
                                    filename=filename,
                                    project_id=project_id,
                                    db=db,
                                    order_index=current_count + extracted_count,
                                    is_featured=(current_count == 0 and extracted_count == 0)
                                )
                                
                                extracted_count += 1
                                
                            except Exception as e:
                                print(f"Failed to extract image {file_info.filename}: {e}")
                                continue
                
                print(f"Successfully extracted {extracted_count} images from DOCX")
                
            finally:
                # Clean up temp file
                os.unlink(tmp_path)
            
        except Exception as e:
            print(f"Error extracting images from DOCX: {e}")
        
        return extracted_count
