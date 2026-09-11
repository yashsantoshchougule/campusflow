from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List
import os
import tempfile
from pathlib import Path
from app.utils.file_processor import extract_text_from_file
from app.utils.logger import get_logger
from app.services.export_service import export_service
from app.services.mistral_service import mistral_service

router = APIRouter(prefix="/api/pen2pdf", tags=["pen2pdf"])
logger = get_logger("PEN2PDF")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

# app/routes/pen2pdf.py

@router.post("/extract")
async def extract_documents(
    files: List[UploadFile] = File(...)
):
    logger.info(f"Received document extraction request for {len(files)} files")
    temp_files = []
    original_names = {}
    extracted_content = []
    
    try:
        for file in files:
            contents = await file.read()
            if not contents or len(contents) > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Files must be between 1 byte and 10 MB")

            suffix = Path(file.filename or "upload").suffix
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
                temp.write(contents)
                file_path = temp.name
            temp_files.append(file_path)
            original_names[file_path] = file.filename or "upload"
            logger.info(f"Saved temporary upload: {Path(file_path).name}")
        
        # Process files
        for file_path in temp_files:
            filename = original_names[file_path]
            ext = os.path.splitext(filename)[1].lower()
            
            if ext in ['.pdf', '.png', '.jpg', '.jpeg', '.webp']:
                logger.info(f"Processing {filename} with Mistral OCR...")
                text = mistral_service.ocr_extract(file_path)
                logger.success(f"Successfully extracted text from {filename} using Mistral OCR")
            else:
                logger.info(f"Processing {filename} with text extraction...")
                text = await extract_text_from_file(file_path)
                logger.success(f"Successfully extracted text from {filename}")
            
            extracted_content.append({"filename": filename, "content": text})
            logger.debug(f"Content length for {filename}: {len(text)} characters")
        
        combined_content = "\n\n---\n\n".join([
            f"## {item['filename']}\n\n{item['content']}" for item in extracted_content
        ])
        
        logger.success(f"Document extraction complete! Processed {len(extracted_content)} files. Total content: {len(combined_content)} characters")
        
        # Frontend expects 'markdown' field
        return {
            "markdown": combined_content, 
            "files_processed": len(extracted_content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document extraction failed: {str(e)}", exc_info=e)
        raise HTTPException(status_code=500, detail="Document extraction failed") from e
    finally:
        # ALWAYS delete files after processing
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)
                logger.debug(f"Cleaned up temporary file: {path}")

@router.post("/export")
async def export_document(
    content: str = Form(...),
    title: str = Form(...),
    format: str = Form(...),
    add_watermark: bool = Form(True)
):
    """Export document to PDF, DOCX, or Markdown."""
    logger.info(f"Received export request: title='{title}', format={format}, watermark={add_watermark}")
    
    try:
        if format == "pdf":
            logger.debug("Exporting to PDF format")
            output = await export_service.export_to_pdf(content, title, add_watermark)
            media_type = "application/pdf"
            filename = f"{title}.pdf"
        elif format == "docx":
            logger.debug("Exporting to DOCX format")
            output = export_service.export_to_docx(content, title)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = f"{title}.docx"
        elif format == "markdown":
            logger.debug("Exporting to Markdown format")
            output = export_service.export_to_markdown(content, title)
            media_type = "text/markdown"
            filename = f"{title}.md"
        else:
            logger.error(f"Invalid export format requested: {format}")
            raise HTTPException(status_code=400, detail="Invalid format")
        
        logger.success(f"Successfully exported '{title}' to {format.upper()} format")
        return StreamingResponse(
            output,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        logger.error(f"Export failed: {str(e)}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))
