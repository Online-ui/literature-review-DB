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
            
            # Save PDF temporarily for camelot
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
                    print(f"Starting table extraction from PDF using Camelot...")
                    tables_extracted = await self._extract_tables_with_camelot(
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
            print("Please install: pip install PyMuPDF camelot-py[cv] pandas matplotlib")
        except Exception as e:
            print(f"Error extracting from PDF: {e}")
            import traceback
            traceback.print_exc()
        
        return extracted_count
    
    async def _extract_tables_with_camelot(self, pdf_path: str, project_id: int, db: Session, start_index: int) -> int:
        """Extract tables from PDF using Camelot and convert to images"""
        tables_count = 0
        
        try:
            import camelot
            
            # Get number of pages
            import fitz
            pdf_doc = fitz.open(pdf_path)
            num_pages = len(pdf_doc)
            pdf_doc.close()
            
            print(f"Searching for tables in {num_pages} pages using Camelot...")
            
            all_tables = []
            
            # Process each page
            for page_num in range(1, num_pages + 1):  # Camelot uses 1-based page numbers
                try:
                    # Try lattice method first (for tables with borders)
                    tables_lattice = camelot.read_pdf(
                        pdf_path,
                        pages=str(page_num),
                        flavor='lattice',
                        line_scale=50,  # Helps detect faint lines
                        split_text=True,
                        flag_size=True,
                        strip_text='\n'
                    )
                    
                    if tables_lattice.n > 0:
                        print(f"Found {tables_lattice.n} tables on page {page_num} using lattice method")
                        for table in tables_lattice:
                            if self._is_valid_camelot_table(table):
                                all_tables.append((table.df, f'page_{page_num}_lattice', table.accuracy))
                    
                    # Try stream method (for tables without borders)
                    tables_stream = camelot.read_pdf(
                        pdf_path,
                        pages=str(page_num),
                        flavor='stream',
                        edge_tol=50,
                        row_tol=2,
                        column_tol=2
                    )
                    
                    if tables_stream.n > 0:
                        print(f"Found {tables_stream.n} tables on page {page_num} using stream method")
                        for table in tables_stream:
                            if self._is_valid_camelot_table(table):
                                # Check if it's not a duplicate of lattice table
                                is_duplicate = False
                                for existing_table, _, _ in all_tables:
                                    if self._tables_are_similar(table.df, existing_table):
                                        is_duplicate = True
                                        break
                                
                                if not is_duplicate:
                                    all_tables.append((table.df, f'page_{page_num}_stream', table.accuracy))
                    
                except Exception as e:
                    print(f"Error processing page {page_num}: {e}")
                    continue
            
            print(f"Total tables found: {len(all_tables)}")
            
            # Sort tables by accuracy and process them
            all_tables.sort(key=lambda x: x[2], reverse=True)
            
            # Convert tables to images
            for idx, (table_df, source, accuracy) in enumerate(all_tables):
                try:
                    print(f"Processing table {idx + 1} from {source} (accuracy: {accuracy:.2f})")
                    
                    # Clean the table
                    table_df = self._clean_table(table_df)
                    
                    # Convert table to image with better formatting
                    table_image_bytes = await self._table_to_image_enhanced(
                        table_df, 
                        idx + 1,
                        source=source,
                        accuracy=accuracy
                    )
                    
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
                    import traceback
                    traceback.print_exc()
                    continue
                    
        except ImportError as e:
            print(f"Camelot not installed: {e}")
            print("Please install: pip install camelot-py[cv]")
        except Exception as e:
            print(f"Error extracting tables with Camelot: {e}")
            import traceback
            traceback.print_exc()
        
        return tables_count
    
    def _is_valid_camelot_table(self, table) -> bool:
        """Check if Camelot table is valid"""
        if table is None or table.df.empty:
            return False
        
        # Check minimum dimensions
        if table.shape[0] < self.min_table_rows or table.shape[1] < self.min_table_cols:
            return False
        
        # Check accuracy (Camelot provides accuracy metric)
        if hasattr(table, 'accuracy') and table.accuracy < 30:  # 30% minimum accuracy
            return False
        
        # Check if table has meaningful content
        non_empty_cells = 0
        total_cells = table.shape[0] * table.shape[1]
        
        for i in range(table.shape[0]):
            for j in range(table.shape[1]):
                cell_value = str(table.df.iloc[i, j]).strip()
                if cell_value and cell_value not in ['', 'nan', 'None']:
                    non_empty_cells += 1
        
        if non_empty_cells / total_cells < 0.2:  # At least 20% non-empty cells
            return False
        
        return True
    
    def _tables_are_similar(self, table1: pd.DataFrame, table2: pd.DataFrame) -> bool:
        """Check if two tables are similar (to avoid duplicates)"""
        if table1.shape != table2.shape:
            return False
        
        try:
            # Compare first and last cells
            if (str(table1.iloc[0, 0]) == str(table2.iloc[0, 0]) and 
                str(table1.iloc[-1, -1]) == str(table2.iloc[-1, -1])):
                # Compare a few more cells to be sure
                sample_matches = 0
                samples_to_check = min(5, table1.shape[0] * table1.shape[1])
                
                for _ in range(samples_to_check):
                    i = np.random.randint(0, table1.shape[0])
                    j = np.random.randint(0, table1.shape[1])
                    if str(table1.iloc[i, j]) == str(table2.iloc[i, j]):
                        sample_matches += 1
                
                return sample_matches >= samples_to_check * 0.8
        except:
            pass
        
        return False
    
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
            
            # Dynamic sizing
            cell_width = max(1.5, min(3, 20 / n_cols))
            cell_height = 0.6
            fig_width = max(8, min(20, n_cols * cell_width))
            fig_height = max(4, min(15, (n_rows + 3) * cell_height))
            
            # Create figure with better DPI
            fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=150)
            ax.axis('tight')
            ax.axis('off')
            
            # Add title with metadata
            title = f"Table {table_number}"
            if source:
                title += f" ({source.replace('_', ' ')})"
            
            fig.text(0.5, 0.98, title, ha='center', va='top', 
                    fontsize=14, fontweight='bold')
            
            # Add accuracy indicator if available
            if accuracy > 0:
                accuracy_color = 'green' if accuracy > 80 else 'orange' if accuracy > 50 else 'red'
                fig.text(0.5, 0.94, f"Extraction confidence: {accuracy:.0f}%", 
                        ha='center', va='top', fontsize=10, 
                        color=accuracy_color, style='italic')
            
            # Create table with better formatting
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
    
    def _is_valid_table(self, df: pd.DataFrame) -> bool:
        """Check if DataFrame is a valid table"""
        if df is None or df.empty:
            return False
        
        # Check minimum dimensions
        if df.shape[0] < self.min_table_rows or df.shape[1] < self.min_table_cols:
            return False
        
        # Check if table has meaningful content (not all empty)
        non_empty_cells = 0
        total_cells = df.shape[0] * df.shape[1]
        
        for i in range(df.shape[0]):
            for j in range(df.shape[1]):
                cell_value = str(df.iloc[i, j]).strip()
                if cell_value and cell_value not in ['', 'nan', 'None']:
                    non_empty_cells += 1
        
        # At least 30% non-empty cells
        if non_empty_cells / total_cells < 0.3:
            return False
        
        return True

            
