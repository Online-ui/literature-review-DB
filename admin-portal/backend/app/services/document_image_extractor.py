import io
import os
import uuid
from pathlib import Path
from typing import List, Tuple
import tempfile
from sqlalchemy.orm import Session
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import pandas as pd
from PIL import Image
import numpy as np

from .database_image_service import DatabaseImageService

class DocumentImageExtractor:
    def __init__(self, db_image_service: DatabaseImageService):
        self.db_image_service = db_image_service
        self.min_image_size = 5000  # Minimum 5KB to filter out tiny images
        self.min_table_rows = 2  # Minimum rows for a valid table
        self.min_table_cols = 2  # Minimum columns for a valid table
    
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
            import tabula
            
            # Save PDF temporarily for tabula
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
                    tables_extracted = await self._extract_tables_from_pdf(
                        tmp_path, 
                        project_id, 
                        db, 
                        current_count + extracted_count
                    )
                    extracted_count += tables_extracted
                
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            
            print(f"Successfully extracted {extracted_count} images and tables from PDF")
            
        except ImportError as e:
            print(f"Missing required library: {e}")
            print("Please install: pip install PyMuPDF tabula-py pandas matplotlib")
        except Exception as e:
            print(f"Error extracting from PDF: {e}")
            import traceback
            traceback.print_exc()
        
        return extracted_count
    
    async def _extract_tables_from_pdf(self, pdf_path: str, project_id: int, db: Session, start_index: int) -> int:
        """Extract tables from PDF and convert to images"""
        tables_count = 0
        
        try:
            import tabula
            
            # Get number of pages
            import fitz
            pdf_doc = fitz.open(pdf_path)
            num_pages = len(pdf_doc)
            pdf_doc.close()
            
            print(f"Searching for tables in {num_pages} pages...")
            
            # Try different extraction methods
            all_tables = []
            
            # Method 1: Extract with lattice (good for bordered tables)
            try:
                tables_lattice = tabula.read_pdf(
                    pdf_path, 
                    pages='all',
                    multiple_tables=True,
                    lattice=True,
                    pandas_options={'header': None}
                )
                all_tables.extend([(t, 'lattice', i) for i, t in enumerate(tables_lattice)])
                print(f"Found {len(tables_lattice)} tables using lattice method")
            except Exception as e:
                print(f"Lattice extraction failed: {e}")
            
            # Method 2: Extract with stream (good for borderless tables)
            try:
                tables_stream = tabula.read_pdf(
                    pdf_path, 
                    pages='all',
                    multiple_tables=True,
                    stream=True,
                    pandas_options={'header': None}
                )
                all_tables.extend([(t, 'stream', i) for i, t in enumerate(tables_stream)])
                print(f"Found {len(tables_stream)} tables using stream method")
            except Exception as e:
                print(f"Stream extraction failed: {e}")
            
            # Process unique tables
            processed_tables = []
            for table, method, idx in all_tables:
                if self._is_valid_table(table) and not self._is_duplicate_table(table, processed_tables):
                    processed_tables.append(table)
            
            print(f"Processing {len(processed_tables)} unique valid tables")
            
            # Convert tables to images
            for idx, table in enumerate(processed_tables):
                try:
                    # Clean the table
                    table = self._clean_table(table)
                    
                    # Convert table to image with better formatting
                    table_image_bytes = await self._table_to_image_enhanced(table, idx + 1)
                    
                    if table_image_bytes:
                        filename = f"table_{idx + 1}.png"
                        
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
                        print(f"Saved table {idx + 1} as image")
                        
                except Exception as e:
                    print(f"Failed to convert table {idx + 1} to image: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error extracting tables: {e}")
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
        
        # Check if table has meaningful content (not all NaN)
        non_null_ratio = df.notna().sum().sum() / (df.shape[0] * df.shape[1])
        if non_null_ratio < 0.3:  # At least 30% non-null values
            return False
        
        return True
    
    def _is_duplicate_table(self, table: pd.DataFrame, processed_tables: List[pd.DataFrame]) -> bool:
        """Check if table is duplicate of already processed tables"""
        for processed in processed_tables:
            if table.shape == processed.shape:
                # Simple check: if shapes match and first/last cells match
                try:
                    if (table.iloc[0, 0] == processed.iloc[0, 0] and 
                        table.iloc[-1, -1] == processed.iloc[-1, -1]):
                        return True
                except:
                    pass
        return False
    
    def _clean_table(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and format table data"""
        # Replace NaN with empty string
        df = df.fillna('')
        
        # Convert all cells to string
        df = df.astype(str)
        
        # Remove extra whitespace
        df = df.applymap(lambda x: ' '.join(x.split()) if isinstance(x, str) else x)
        
        # Remove rows that are completely empty
        df = df[~(df == '').all(axis=1)]
        
        # Remove columns that are completely empty
        df = df.loc[:, ~(df == '').all(axis=0)]
        
        return df
    
    async def _table_to_image_enhanced(self, df: pd.DataFrame, table_number: int) -> bytes:
        """Convert pandas DataFrame to a nicely formatted image"""
        try:
            # Calculate figure size based on table dimensions
            n_rows, n_cols = df.shape
            cell_width = 2.5
            cell_height = 0.5
            fig_width = max(10, min(20, n_cols * cell_width))
            fig_height = max(4, min(15, (n_rows + 2) * cell_height))
            
            # Create figure
            fig, ax = plt.subplots(figsize=(fig_width, fig_height))
            ax.axis('tight')
            ax.axis('off')
            
            # Add title with better styling
            title = f"Table {table_number}"
            fig.text(0.5, 0.98, title, ha='center', va='top', 
                    fontsize=16, fontweight='bold', 
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgray', alpha=0.5))
            
            # Create table with better formatting
            table = ax.table(
                cellText=df.values,
                cellLoc='left',
                loc='center',
                colWidths=[1.0/n_cols] * n_cols
            )
            
            # Style the table
            table.auto_set_font_size(False)
            table.set_fontsize(10)
            table.scale(1.2, 1.8)
            
            # Color scheme
            header_color = '#2E86AB'
            row_colors = ['#F0F0F0', '#FFFFFF']
            
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
                    cell.set_text_props(linespacing=1.5)
                    
                    # Wrap long text
                    text = cell.get_text()
                    if text and len(text.get_text()) > 50:
                        text.set_wrap(True)
            
            # Add border
            for key, cell in table.get_celld().items():
                cell.set_linewidth(1)
                cell.set_edgecolor('gray')
            
            # Adjust layout
            plt.subplots_adjust(left=0.02, right=0.98, top=0.92, bottom=0.02)
            
            # Save to bytes with high quality
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', 
                       pad_inches=0.5, facecolor='white', edgecolor='none')
            plt.close()
            
            buf.seek(0)
            return buf.read()
            
        except Exception as e:
            print(f"Error converting table to image: {e}")
            import traceback
            traceback.print_exc()
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
                                    # Handle merged cells
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
                                    table_image_bytes = await self._table_to_image_enhanced(df, table_count + 1)
                                    
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
