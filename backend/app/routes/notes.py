import io
import re
import tempfile
import zipfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.ai.provider import AIConfigurationError, AIInputError, AIUnavailableError
from app.auth import require_user
from app.services.export_service import export_service
from app.services.gemini_service import gemini_service
from app.services.longcat_service import longcat_service
from app.utils.file_processor import extract_text_from_file
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/notes", tags=["notes"])
logger = get_logger("NOTES")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.post("/generate")
async def generate_notes(files: List[UploadFile] = File(...), user: dict = Depends(require_user)):
    """Generate notes from authenticated uploads; durable copies are stored by the browser."""
    temp_files: list[Path] = []

    try:
        extracted_text = ""
        for upload in files:
            contents = await upload.read()
            if not contents or len(contents) > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Files must be between 1 byte and 10 MB")

            suffix = Path(upload.filename or "upload").suffix
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
                temp.write(contents)
                file_path = Path(temp.name)
            temp_files.append(file_path)

            text = await extract_text_from_file(str(file_path))
            extracted_text += text + "\n\n"

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from files")

        result = await gemini_service.generate_notes(extracted_text, str(user["id"]), [str(path) for path in temp_files])

        return {
            "note": {"content": result.content},
            **result.model_dump(mode="json", exclude={"content"}),
        }
    except HTTPException:
        raise
    except AIConfigurationError as error:
        raise HTTPException(status_code=503, detail="AI backend configuration error") from error
    except AIInputError as error:
        raise HTTPException(status_code=400, detail="AI request could not be processed") from error
    except AIUnavailableError as error:
        raise HTTPException(status_code=503, detail="AI temporarily unavailable") from error
    except Exception as error:
        logger.error(f"Note generation failed: {error}", exc_info=error)
        raise HTTPException(status_code=500, detail="Note generation failed") from error
    finally:
        for path in temp_files:
            path.unlink(missing_ok=True)


@router.post("/format")
async def format_notes(payload: dict):
    content = payload.get("content", "")
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    try:
        formatted = await longcat_service.format_notes(content)
        if formatted.startswith(("Error generating with LongCat:", "Error:")):
            return {"content": content, "error": formatted}
        return {"content": formatted}
    except Exception as error:
        return {"content": content, "error": f"Formatting failed: {error}"}


@router.post("/export-zip")
async def export_folder_as_zip(payload: dict):
    format_name = payload.get("format", "pdf")
    notes = payload.get("notes", [])
    folder_name = str(payload.get("folder_name", "notes"))
    exporters = {
        "pdf": lambda content, title: export_service.export_to_pdf(content, title, watermark=False),
        "docx": export_service.export_to_docx,
        "txt": export_service.export_to_txt,
        "md": export_service.export_to_markdown,
    }
    if format_name not in exporters:
        raise HTTPException(status_code=400, detail="Invalid export format")
    if not isinstance(notes, list) or not notes or len(notes) > 1000:
        raise HTTPException(status_code=400, detail="Export requires 1 to 1000 notes")

    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as output:
        for index, note in enumerate(notes, 1):
            title = str(note.get("title", "Untitled"))
            content = str(note.get("content", ""))
            safe_title = re.sub(r"[^\w\s-]", "", title).strip() or "Untitled"
            exported = exporters[format_name](content, title)
            if format_name == "pdf":
                exported = await exported
            output.writestr(f"{index:03d}-{safe_title}.{format_name}", exported.read())

    archive.seek(0)
    safe_folder = re.sub(r"[^\w\s-]", "", folder_name).strip() or "notes"
    return StreamingResponse(
        archive,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_folder}.zip"'},
    )
