"""Notice OCR/structure pipeline.

OCR control flow adapted from dagimgetaw/OCR image_processing.py and
pdf_processing.py (MIT declared in its README; no LICENSE file in that repo).
Date/profile boundaries adapted from RPA-Driven-Academic-Mail-Manager
(Copyright (c) 2025 Nidhish, MIT).
"""
from __future__ import annotations

import os
import re
import tempfile
from io import BytesIO
from typing import Callable, Protocol

from pypdf import PdfReader

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_BYTES = 10 * 1024 * 1024
INJECTION = re.compile(r"ignore (?:all |any )?(?:previous|system)|system prompt|act as|developer message", re.I)
DATE = re.compile(r"\b(?:\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{4})?)\b", re.I)


def sanitize_notice_text(text: str) -> str:
    return "\n".join(line.strip() for line in text.replace("\x00", "").splitlines() if line.strip() and not INJECTION.search(line))


class NoticeDocumentParser:
    def __init__(self, ocr: Callable[[bytes, str], str] | None = None):
        self.ocr = ocr or self._mistral_ocr

    def parse(self, data: bytes, mime_type: str, file_name: str) -> tuple[list[dict], str | None]:
        if mime_type == "application/pdf":
            reader = PdfReader(BytesIO(data))
            pages = [{"pageNumber": index + 1, "text": sanitize_notice_text(page.extract_text() or "")} for index, page in enumerate(reader.pages)]
            if any(page["text"] for page in pages):
                return pages, None
            try:
                text = sanitize_notice_text(self.ocr(data, ".pdf"))
                return [{"pageNumber": 1, "text": text}], None if text else "No readable text was extracted."
            except Exception as error:
                return [{"pageNumber": 1, "text": ""}], f"OCR unavailable: {error}"
        try:
            suffix = os.path.splitext(file_name)[1] or ".jpg"
            text = sanitize_notice_text(self.ocr(data, suffix))
            return [{"pageNumber": 1, "text": text}], None if text else "No readable text was extracted."
        except Exception as error:
            return [{"pageNumber": 1, "text": ""}], f"OCR unavailable: {error}"

    @staticmethod
    def _mistral_ocr(data: bytes, suffix: str) -> str:
        from app.services.mistral_service import mistral_service

        path = ""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
                temporary.write(data)
                path = temporary.name
            return mistral_service.ocr_extract(path)
        finally:
            if path and os.path.exists(path):
                os.unlink(path)


class NoticeExtractionProvider(Protocol):
    def extract(self, pages: list[dict]) -> dict: ...


def _field(value, snippet: str | None = None, page: int | None = None, confidence: str = "low") -> dict:
    return {"value": value, "confidence": confidence, "sourceSnippet": snippet, "pageNumber": page}


class RuleBasedNoticeExtractionProvider:
    """Deterministic server-side provider; output stays usable when hosted AI is unavailable."""

    def extract(self, pages: list[dict]) -> dict:
        rows = [(line, page["pageNumber"]) for page in pages for line in page["text"].splitlines() if line.strip()]
        title = rows[0] if rows else (None, None)

        def matching(pattern: str) -> list[tuple[str, int]]:
            regex = re.compile(pattern, re.I)
            return [(line, page) for line, page in rows if regex.search(line)]

        def list_field(pattern: str) -> dict:
            matches = matching(pattern)
            return _field([line for line, _ in matches] or None, matches[0][0] if matches else None, matches[0][1] if matches else None, "medium" if matches else "low")

        deadline_rows = []
        for line, page in rows:
            deadline_rows.extend((match.group(0), line, page) for match in DATE.finditer(line))
        eligibility_rows = matching(r"eligible|eligibility|students?|semester|\byear\b|branch|course|division|ATKT")
        eligibility_text = " ".join(line for line, _ in eligibility_rows)

        def values(pattern: str) -> list[str] | None:
            found = list(dict.fromkeys(match.group(0).strip() for match in re.finditer(pattern, eligibility_text, re.I)))
            return found or None

        category_patterns = [("ATKT", r"\bATKT\b"), ("Scholarship", r"scholarship"), ("Examination", r"exam(?:ination)?"), ("Assignment", r"assignment"), ("Fee", r"\bfees?\b|payment"), ("Event", r"event|seminar|workshop")]
        category = next(((name, match[0]) for name, pattern in category_patterns if (match := matching(pattern))), None)
        source = eligibility_rows[0] if eligibility_rows else (None, None)
        return {
            "title": _field(title[0], title[0], title[1], "high" if title[0] else "low"),
            "deadlines": [_field(value, snippet, page, "high" if re.search(r"\b\d{4}\b", value) else "medium") for value, snippet, page in deadline_rows],
            "instructions": list_field(r"submit|apply|register|report|complete|pay|send|bring|upload"),
            "eligibility": list_field(r"eligible|eligibility|students?|semester|\byear\b|branch|course|division|ATKT"),
            "requiredDocuments": list_field(r"documents?|certificate|marksheet|photo|aadhar|aadhaar|receipt|identity card|ID card"),
            "category": _field(category[0] if category else "General academic", category[1][0] if category else title[0], category[1][1] if category else title[1], "high" if category else "medium"),
            "applicableCourses": _field(values(r"\b(?:B\.?Sc\.?\s*(?:IT|CS)?|B\.?Tech\.?|BCA|MCA|MBA|M\.?Sc\.?)\b"), source[0], source[1], "medium" if source[0] else "low"),
            "applicableBranches": _field(values(r"\b(?:IT|CS|CSE|ECE|Mechanical|Civil|Electrical)\b"), source[0], source[1], "medium" if source[0] else "low"),
            "applicableYears": _field(values(r"\b(?:first|second|third|fourth|1st|2nd|3rd|4th)\s+year\b"), source[0], source[1], "medium" if source[0] else "low"),
            "applicableSemesters": _field(values(r"\b(?:semester|sem)\s*[IVX\d]+\b"), source[0], source[1], "medium" if source[0] else "low"),
            "applicableDivisions": _field(values(r"\bdivision\s+[A-Z0-9]+\b"), source[0], source[1], "medium" if source[0] else "low"),
        }


def validate_structured_support(structured: dict, pages: list[dict]) -> dict:
    text = " ".join(page["text"] for page in pages).lower()
    for name, value in structured.items():
        fields = value if name == "deadlines" else [value]
        for field in fields:
            snippet = (field.get("sourceSnippet") or "").lower()
            if field.get("value") is not None and (not snippet or snippet not in text):
                field.update(value=None, confidence="low", sourceSnippet=None, pageNumber=None)
    return structured
