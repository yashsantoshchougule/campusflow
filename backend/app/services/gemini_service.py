from app.ai.models import AIRequest, AIResponse, EvidenceChunk
from app.ai.service import get_ai_service


class GeminiService:
    async def generate_text(
        self,
        prompt: str,
        student_id: str,
        authorized_context: str = "",
        evidence_chunks: list[EvidenceChunk] | None = None,
        source_citations: list[str] | None = None,
        safety_instructions: str = "Answer only the authorized request. Do not invent facts.",
        language_preference: str = "English",
        file_paths: list[str] | None = None,
    ) -> AIResponse:
        request = AIRequest(
            prompt=prompt,
            student_id=student_id,
            authorized_context=authorized_context,
            evidence_chunks=evidence_chunks or [],
            source_citations=source_citations or [],
            safety_instructions=safety_instructions,
            language_preference=language_preference,
            file_paths=file_paths or [],
        )
        return await get_ai_service().generate(request)

    async def generate_notes(self, text: str, student_id: str, file_paths: list[str] | None = None) -> AIResponse:
        prompt = """Create concise, exam-focused study notes from the authorized material.
Include a title, overview, key takeaways, concepts, relevant formulas or definitions,
procedures, examples, 3-9 review questions with answers, and a final simple explanation.
Use source citations when available and never add unsupported academic facts."""
        return await self.generate_text(
            prompt,
            student_id,
            authorized_context=text,
            safety_instructions="Use only the authorized study material. Never invent facts, dates, marks, rules, deadlines, or sources.",
            file_paths=file_paths,
        )


gemini_service = GeminiService()
