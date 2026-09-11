"""Local extraction and server-only grounded generation endpoints."""

from io import BytesIO
from typing import Literal

from docx import Document
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from pypdf import PdfReader

from app.ai.provider import AIConfigurationError, AIInputError, AIUnavailableError
from app.auth import require_user
from app.services.study_ai_provider import Operation, ProviderChunk, get_study_ai_provider


router = APIRouter(prefix="/api/study-ai", tags=["study-ai"])
MAX_BYTES = 10 * 1024 * 1024


class ChunkPayload(BaseModel):
    id: str = Field(min_length=1, max_length=240)
    text: str = Field(min_length=1, max_length=20_000)


class GenerationPayload(BaseModel):
    operation: Operation
    question: str | None = Field(default=None, max_length=2_000)
    chunks: list[ChunkPayload] = Field(min_length=1, max_length=8)


def extract_document_bytes(filename: str, content_type: str, data: bytes) -> dict:
    lower = filename.lower()
    pages: list[dict] = []
    try:
        if content_type == "application/pdf" or lower.endswith(".pdf"):
            pages = [{"pageNumber": index, "text": (page.extract_text() or "").strip()} for index, page in enumerate(PdfReader(BytesIO(data)).pages, start=1)]
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or lower.endswith(".docx"):
            lines = []
            for paragraph in Document(BytesIO(data)).paragraphs:
                text = paragraph.text.strip()
                if not text:
                    continue
                lines.append(f"# {text}" if paragraph.style and paragraph.style.name.startswith("Heading") else text)
            pages = [{"text": "\n".join(lines)}]
        elif content_type in {"text/plain", "text/markdown"} or lower.endswith((".txt", ".md")):
            pages = [{"text": data.decode("utf-8", errors="replace")}]
        else:
            raise ValueError("Unsupported document type")
    except (ValueError, OSError) as error:
        raise ValueError("The document could not be extracted") from error

    if sum(len(page["text"].strip()) for page in pages) < 20:
        return {"status": "no_extractable_text", "pages": pages, "message": "This document currently has no extractable text."}
    return {"status": "ready", "pages": pages}


@router.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    data = await file.read(MAX_BYTES + 1)
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Files must be between 1 byte and 10 MB")
    try:
        return extract_document_bytes(file.filename or "document", file.content_type or "application/octet-stream", data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/generate")
async def generate(payload: GenerationPayload, user: dict = Depends(require_user)):
    try:
        chunks: list[ProviderChunk] = [{"id": chunk.id, "text": chunk.text} for chunk in payload.chunks]
        return await get_study_ai_provider().generate(payload.operation, chunks, payload.question, str(user["id"]))
    except AIConfigurationError as error:
        raise HTTPException(status_code=503, detail="AI backend configuration error") from error
    except AIInputError as error:
        raise HTTPException(status_code=400, detail="AI request could not be processed") from error
    except AIUnavailableError as error:
        raise HTTPException(status_code=503, detail="AI temporarily unavailable") from error
    except Exception as error:
        raise HTTPException(status_code=503, detail="AI temporarily unavailable") from error
