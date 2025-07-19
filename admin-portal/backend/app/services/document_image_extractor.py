import io
import os
import uuid
from pathlib import Path
from typing import List, Tuple, Optional
import tempfile
from sqlalchemy.orm import Session
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import pandas as pd
from PIL import Image
import numpy as np
import cv2

from .database_image_service import DatabaseImageService

class DocumentImageExtractor:
    def __init__(self, db_image_service: DatabaseImageService):
        self.db_image_service = db_image_service
        self.min_image_size = 5000  # Minimum 5KB to filter out tiny images
        self.min_table_rows = 2  # Minimum rows for a valid table
        self.min_table_cols = 2  # Minimum columns for a valid table
        self.min_table_area = 10000  # Minimum area for CV table detection
        self.min_lines = 3  # Minimum lines for CV table detection
    
    async def extract_images_from_document(
        self, 
        document_data: bytes, 
        filename: str, 
        project_id: int,
        db: Session,
        extract_tables: bool = True
    ) -> int:
        """Extract images and tables from document and save to database."""
        file_ext = Path(filename).suffix.lower()
        
        if file_ext == '.pdf':
            return await self._extract_from_pdf(document_data, project_id, db, extract_tables)
        elif file_ext in ['.docx', '.doc']:
            return await self._extract_from_docx(document_data, project_id, db, extract_tables)
        else:
            return 0
    
    async def _extract_from_pdf(self, pdf_data: bytes, project_id: int, db: Session, extract_tables: bool = True) -> int:
        """Extract images and tables from PDF and save to database"""
        extracted_count = 0
        
        try:
            import fitz  # PyMuPDF
            
            # Save PDF temporarily for table extraction
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(pdf_data)
                tmp_path = tmp_file.name
            
            try:
                # Extract regular images first
                pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
                
                # Get current image count for ordering
                from ..models.project import ProjectImage
                current_count = db.query(ProjectImage).filter(ProjectImage.project_id == project_id).count()
                
                print(f"Starting extraction from PDF with {len(pdf_document)} pages")
                
                # Extract images
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
                            filename = f"figure_p{page_num + 1}_img{img_index + 1}.{ext}"
                            
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
                            print(f"Extracted figure from page {page_num + 1}")
                            
                        except Exception as e:
                            print(f"Failed to extract image {img_index} from page {page_num}: {e}")
                            continue
                
                pdf_document.close()
                
                # Extract tables if requested
                if extract_tables:
                    print(f"Starting table extraction from PDF...")
                    
                    # Try multiple methods in order of preference
                    tables_extracted = 0
                    
                    # Method 1: Try CV-based detection
                    try:
                        tables_extracted = await self._extract_tables_with_cv(
                            tmp_path, 
                            project_id, 
                            db, 
                            current_count + extracted_count
                        )
                        print(f"CV method extracted {tables_extracted} tables")
                    except Exception as e:
                        print(f"CV table extraction failed: {e}")
                    
                    # Method 2: If CV fails or finds no tables, try pdfplumber
                    if tables_extracted == 0:
                        try:
                            import pdfplumber
                            tables_extracted = await self._extract_tables_with_pdfplumber(
                                tmp_path, 
                                project_id, 
                                db, 
                                current_count + extracted_count
                            )
                            print(f"pdfplumber extracted {tables_extracted} tables")
                        except ImportError:
                            print("pdfplumber not available")
                        except Exception as e:
                            print(f"pdfplumber extraction failed: {e}")
                    
                    extracted_count += tables_extracted
                
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            
            print(f"Successfully extracted {extracted_count} images and tables from PDF")
            
        except ImportError as e:
            print(f"Missing required library: {e}")
            print("Please install: pip install PyMuPDF opencv-python pdf2image pdfplumber")
        except Exception as e:
            print(f"Error extracting from PDF: {e}")
            import traceback
            traceback.print_exc()
        
        return extracted_count
    
    async def _extract_tables_with_cv(self, pdf_path: str, project_id: int, db: Session, start_index: int) -> int:
        """Extract tables using computer vision (line detection)"""
        tables_count = 0
        
        try:
            import pdf2image
            import fitz
            
            # Get number of pages
            pdf_doc = fitz.open(pdf_path)
            num_pages = len(pdf_doc)
            pdf_doc.close()
            
            print(f"Searching for tables in {num_pages} pages using CV detection...")
            
            # Convert PDF pages to images
            pages = pdf2image.convert_from_path(pdf_path, dpi=200)
            
            for page_num, page_image in enumerate(pages):
                print(f"Processing page {page_num + 1}/{num_pages}")
                
                # Detect tables in this page
                table_regions = self._detect_table_regions_cv(page_image)
                
                for table_idx, (table_image, confidence) in enumerate(table_regions):
                    try:
                        # Try to extract structured data using OCR
                        df = self._extract_table_data_ocr(table_image)
                        
                        if df is not None and self._is_valid_table(df):
                            # Clean and convert to image
                            df = self._clean_table(df)
                            table_image_bytes = await self._table_to_image_enhanced(
                                df,
                                tables_count + 1,
                                source=f"CV_page_{page_num + 1}",
                                accuracy=confidence * 100
                            )
                        else:
                            # If OCR fails, save the raw table image
                            print(f"OCR failed for table on page {page_num + 1}, saving raw image")
                            buf = io.BytesIO()
                            table_image.save(buf, format='PNG')
                            table_image_bytes = buf.getvalue()
                        
                        if table_image_bytes:
                            filename = f"table_{tables_count + 1}.png"
                            
                            # Save to database
                            await self.db_image_service.save_image_bytes_to_db(
                                image_bytes=table_image_bytes,
                                filename=filename,
                                project_id=project_id,
                                db=db,
                                order_index=start_index + tables_count,
                                is_featured=False
                            )
                            
                            tables_count += 1
                            print(f"Saved table {tables_count} from page {page_num + 1}")
                    
                    except Exception as e:
                        print(f"Failed to process table on page {page_num + 1}: {e}")
                        continue
                        
        except ImportError as e:
            print(f"Missing required library for CV detection: {e}")
            print("Please install: pip install pdf2image opencv-python")
        except Exception as e:
            print(f"Error in CV table extraction: {e}")
            import traceback
            traceback.print_exc()
        
        return tables_count
    
    def _detect_table_regions_cv(self, page_image: Image.Image) -> List[Tuple[Image.Image, float]]:
        """Detect table regions using computer vision"""
        detected_tables = []
        
        try:
            # Convert PIL to OpenCV format
            img_array = np.array(page_image)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Apply threshold
            _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
            
            # Detect horizontal and vertical lines
            horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
            vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
            
            horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel)
            vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel)
            
            # Combine lines
            table_mask = cv2.add(horizontal_lines, vertical_lines)
            
            # Find contours
            contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = w * h
                
                # Filter by area and aspect ratio
                if area > self.min_table_area and w > 100 and h > 50:
                    # Check if region has enough lines
                    region = table_mask[y:y+h, x:x+w]
                    line_count = self._count_lines(region)
                    
                    if line_count >= self.min_lines:
                        # Crop table region with some padding
                        padding = 10
                        x_start = max(0, x - padding)
                        y_start = max(0, y - padding)
                        x_end = min(page_image.width, x + w + padding)
                        y_end = min(page_image.height, y + h + padding)
                        
                        table_image = page_image.crop((x_start, y_start, x_end, y_end))
                        confidence = min(0.9, line_count / 10.0)  # Simple confidence based on line count
                        
                        detected_tables.append((table_image, confidence))
                        print(f"Detected table region: {w}x{h} pixels, {line_count} lines")
        
        except Exception as e:
            print(f"Error detecting table regions: {e}")
        
        return detected_tables
    
    def _count_lines(self, region: np.ndarray) -> int:
        """Count horizontal and vertical lines in region"""
        try:
            # Count horizontal lines
            horizontal_projection = np.sum(region, axis=1)
            horizontal_lines = np.sum(horizontal_projection > region.shape[1] * 0.3)
            
            # Count vertical lines
            vertical_projection = np.sum(region, axis=0)
            vertical_lines = np.sum(vertical_projection > region.shape[0] * 0.3)
            
            return min(horizontal_lines, vertical_lines)
        except:
            return 0
    
    def _extract_table_data_ocr(self, table_image: Image.Image) -> Optional[pd.DataFrame]:
        """Extract table data using OCR (optional - requires pytesseract)"""
        try:
            import pytesseract
            
            # Preprocess image for better OCR
            # Convert to grayscale
            gray_image = table_image.convert('L')
            
            # Enhance contrast
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(gray_image)
            enhanced_image = enhancer.enhance(2.0)
            
            # OCR with table structure preservation
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(enhanced_image, config=custom_config)
            
            # Parse text into table structure
            lines = text.strip().split('\n')
            data = []
            
            for line in lines:
                if line.strip():
                    # Split by multiple spaces or tabs
                    cells = [cell.strip() for cell in line.split() if cell.strip()]
                    if cells:
                        data.append(cells)
            
            if len(data) >= self.min_table_rows:
                # Create DataFrame
                max_cols = max(len(row) for row in data)
                for row in data:
                    while len(row) < max_cols:
                        row.append('')
                
                df = pd.DataFrame(data)
                return df
                
        except ImportError:
            print("pytesseract not available for OCR")
        except Exception as e:
            print(f"OCR extraction failed: {e}")
        
        return None
    
    async def _extract_tables_with_pdfplumber(self, pdf_path: str, project_id: int, db: Session, start_index: int) -> int:
        """Fallback table extraction using pdfplumber"""
        tables_count = 0
        
        try:
            import pdfplumber
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    tables = page.extract_tables()
                    
                    for table_idx, table in enumerate(tables):
                        if table and len(table) >= self.min_table_rows:
                            try:
                                # Convert to DataFrame
                                df = pd.DataFrame(table)
                                df = self._clean_table(df)
                                
                                if self._is_valid_table(df):
                                    # Convert to image
                                    table_image_bytes = await self._table_to_image_enhanced(
                                        df, 
                                        tables_count + 1,
                                        source=f"pdfplumber_page_{page_num + 1}"
                                    )
                                    
                                    if table_image_bytes:
                                        filename = f"table_{tables_count + 1}.png"
                                        
                                        await self.db_image_service.save_image_bytes_to_db(
                                            image_bytes=table_image_bytes,
                                            filename=filename,
                                            project_id=project_id,
                                            db=db,
                                            order_index=start_index + tables_count,
                                            is_featured=False
                                        )
                                        
                                        tables_count += 1
                                        print(f"Extracted table {tables_count} using pdfplumber")
                            
                            except Exception as e:
                                print(f"Failed to process table {table_idx} on page {page_num}: {e}")
                                continue
        
        except Exception as e:
            print(f"Error extracting tables with pdfplumber: {e}")
            import traceback
            traceback.print_exc()
        
        return tables_count
    
    def _is_valid_table(self, df: pd.DataFrame) -> bool:
        """Check if DataFrame is a valid table"""
        if df is None or df.empty:
            return False
        
        # Check minimum dimensions
        if df.shape[0] < self.min_table_rows or df.shape[1] < self.min_table_cols:
            return False
        
        # Check if table has meaningful content
        non_empty_cells = 0
        total_cells = df.shape[0] * df.shape[1]
        
        for i in range(df.shape[0]):
            for j in range(df.shape[1]):
                cell_value = str(df.iloc[i, j]).strip()
                if cell_value and cell_value not in ['', 'nan', 'None']:
                    non_empty_cells += 1
        
        # At least 30% non-empty cells
        if total_cells > 0 and non_empty_cells / total_cells < 0.3:
            return False
        
        return True
    
    def _clean_table(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and format table data"""
        # Replace NaN with empty string
        df = df.fillna('')
        
        # Convert all cells to string
        df = df.astype(str)
        
        # Clean whitespace and newlines
        df = df.applymap(lambda x: ' '.join(x.split()) if isinstance(x, str) else x)
        
        # Remove rows that are completely empty
        df = df[~(df == '').all(axis=1)]
        
        # Remove columns that are completely empty
        df = df.loc[:, ~(df == '').all(axis=0)]
        
        # Reset index
        df = df.reset_index(drop=True)
        
        return df
    
    async def _table_to_image_enhanced(self, df: pd.DataFrame, table_number: int, 
                                     source: str = "", accuracy: float = 0) -> bytes:
        """Convert pandas DataFrame to a nicely formatted image"""
        try:
            # Calculate figure size based on table dimensions
            n_rows, n_cols = df.shape
            
            # Dynamic sizing with limits
            cell_width = max(1.5, min(3, 20 / n_cols))
            cell_height = 0.6
            fig_width = max(8, min(20, n_cols * cell_width))
            fig_height = max(4, min(15, (n_rows + 3) * cell_height))
            
            # Create figure with better DPI
            fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=150)
            ax.axis('tight')
            ax.axis('off')
            
            # Add title
            title = f"Table {table_number}"
            if source:
                title += f" ({source.replace('_', ' ')})"
            
            fig.text(0.5, 0.98, title, ha='center', va='top', 
                    fontsize=14, fontweight='bold')
            
            # Add extraction info if available
            if accuracy > 0:
                accuracy_color = 'green' if accuracy > 80 else 'orange' if accuracy > 50 else 'red'
                fig.text(0.5, 0.94, f"Confidence: {accuracy:.0f}%", 
                        ha='center', va='top', fontsize=10, 
                        color=accuracy_color, style='italic')
            
            # Create table
            table = ax.table(
                cellText=df.values,
                cellLoc='left',
                loc='center',
                colWidths=[1.0/n_cols] * n_cols
            )
            
            # Style the table
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            table.scale(1.2, 1.5)
            
            # Color scheme
            header_color = '#4A90E2'
            row_colors = ['#F8F9FA', '#FFFFFF']
            border_color = '#E0E0E0'
            
            # Style cells
            for i in range(n_rows):
                for j in range(n_cols):
                    cell = table[(i, j)]
                    
                    # First row as header
                    if i == 0:
                        cell.set_facecolor(header_color)
                        cell.set_text_props(weight='bold', color='white')
                        cell.set_height(0.08)
                    else:
                        # Alternate row colors
                        cell.set_facecolor(row_colors[i % 2])
                        cell.set_height(0.06)
                    
                    # Add padding
                    cell.set_text_props(linespacing=1.2)
                    
                    # Wrap long text
                    text = cell.get_text()
                    if text and len(text.get_text()) > 40:
                        text.set_wrap(True)
                        text.set_fontsize(8)
            
            # Add borders
            for key, cell in table.get_celld().items():
                cell.set_linewidth(0.5)
                cell.set_edgecolor(border_color)
            
            # Adjust layout
            plt.subplots_adjust(left=0.02, right=0.98, top=0.88, bottom=0.02)
            
            # Save to bytes with high quality
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', 
                       pad_inches=0.3, facecolor='white', edgecolor='none')
            plt.close()
            
            buf.seek(0)
            return buf.read()
            
        except Exception as e:
            print(f"Error converting table to image: {e}")
            import traceback
            traceback.print_exc()
            plt.close()  # Ensure figure is closed even on error
            return None
    
    async def _extract_from_docx(self, docx_data: bytes, project_id: int, db: Session, extract_tables: bool = True) -> int:
        """Extract images and tables from DOCX and save to database"""
        extracted_count = 0
        
        try:
            import zipfile
            import tempfile
            from docx import Document
            
            # Get current image count for ordering
            from ..models.project import ProjectImage
            current_count = db.query(ProjectImage).filter(ProjectImage.project_id == project_id).count()
            
            # Save DOCX temporarily
            with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp_file:
                tmp_file.write(docx_data)
                tmp_path = tmp_file.name
            
            try:
                # Extract images from DOCX
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
                                filename = f"figure_{Path(file_info.filename).name}"
                                
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
                                print(f"Extracted image: {filename}")
                                
                            except Exception as e:
                                print(f"Failed to extract image {file_info.filename}: {e}")
                                continue
                
                # Extract tables from DOCX if requested
                if extract_tables:
                    print("Extracting tables from DOCX...")
                    doc = Document(tmp_path)
                    table_count = 0
                    
                    for table_idx, table in enumerate(doc.tables):
                        try:
                            # Convert table to pandas DataFrame
                            data = []
                            for row in table.rows:
                                row_data = []
                                for cell in row.cells:
                                    # Get cell text and clean it
                                    cell_text = cell.text.strip()
                                    row_data.append(cell_text)
                                data.append(row_data)
                            
                            if len(data) >= self.min_table_rows:  # Valid table
                                # Ensure all rows have same number of columns
                                max_cols = max(len(row) for row in data)
                                for row in data:
                                    while len(row) < max_cols:
                                        row.append('')
                                
                                df = pd.DataFrame(data)
                                
                                # Clean and validate table
                                df = self._clean_table(df)
                                
                                if self._is_valid_table(df):
                                    # Convert to image
                                    table_image_bytes = await self._table_to_image_enhanced(
                                        df, 
                                        table_count + 1,
                                        source=f"docx_table_{table_idx + 1}"
                                    )
                                    
                                    if table_image_bytes:
                                        filename = f"table_{table_count + 1}.png"
                                        
                                        # Save to database
                                        await self.db_image_service.save_image_bytes_to_db(
                                            image_bytes=table_image_bytes,
                                            filename=filename,
                                            project_id=project_id,
                                            db=db,
                                            order_index=current_count + extracted_count,
                                            is_featured=False
                                        )
                                        
                                        extracted_count += 1
                                        table_count += 1
                                        print(f"Extracted table {table_count}")
                                
                        except Exception as e:
                            print(f"Failed to extract table {table_idx}: {e}")
                            continue
                
                print(f"Successfully extracted {extracted_count} images and tables from DOCX")
                
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            
        except Exception as e:
            print(f"Error extracting from DOCX: {e}")
            import traceback
            traceback.print_exc()
        
        return extracted_count
