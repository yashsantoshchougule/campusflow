from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.notice_intelligence import (
    ALLOWED_TYPES, MAX_BYTES, NoticeDocumentParser,
    RuleBasedNoticeExtractionProvider, validate_structured_support,
)

router = APIRouter(prefix="/api/notices", tags=["notice-intelligence"])
parser = NoticeDocumentParser()
provider = RuleBasedNoticeExtractionProvider()


@router.post("/extract")
async def extract_notice(file: UploadFile = File(...)):
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Use a JPG, PNG, WebP or PDF notice.")
    data = await file.read()
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Use a notice file between 1 byte and 10 MB.")
    try:
        pages, extraction_error = parser.parse(data, mime_type, file.filename or "notice")
        structured = validate_structured_support(provider.extract(pages), pages) if any(page["text"] for page in pages) else None
        return {"pages": pages, "pageCount": len(pages), "structured": structured, "extractionError": extraction_error}
    except Exception as error:
        return {"pages": [], "pageCount": 0, "structured": None, "extractionError": f"Extraction unavailable: {error}"}
