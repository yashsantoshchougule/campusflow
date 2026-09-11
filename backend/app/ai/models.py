from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class EvidenceChunk(BaseModel):
    id: str = Field(min_length=1, max_length=240)
    text: str = Field(min_length=1, max_length=20_000)


class AIRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    prompt: str = Field(min_length=1, max_length=200_000)
    student_id: str = Field(min_length=1, max_length=240)
    authorized_context: str = Field(default="", max_length=500_000)
    evidence_chunks: list[EvidenceChunk] = Field(default_factory=list, max_length=100)
    source_citations: list[str] = Field(default_factory=list, max_length=100)
    safety_instructions: str = Field(default="Answer only the authorized request. Do not invent facts.", max_length=10_000)
    language_preference: str = Field(default="English", min_length=1, max_length=80)
    file_paths: list[str] = Field(default_factory=list, exclude=True, repr=False, max_length=20)

    def provider_prompt(self) -> str:
        evidence = "\n\n".join(f"[CHUNK {chunk.id}]\n{chunk.text}" for chunk in self.evidence_chunks)
        sections = [
            f"Safety instructions:\n{self.safety_instructions}",
            f"Language preference: {self.language_preference}",
            f"Task:\n{self.prompt}",
        ]
        if self.authorized_context:
            sections.append(f"Authorized context:\n{self.authorized_context}")
        if evidence:
            sections.append(f"Authorized evidence:\n{evidence}")
        return "\n\n".join(sections)


class ProviderOutput(BaseModel):
    content: str = Field(min_length=1, max_length=1_000_000)
    source_citations: list[str] = Field(default_factory=list, max_length=100)


class AIResponse(BaseModel):
    content: str = Field(min_length=1, max_length=1_000_000)
    model_used: str = Field(min_length=1, max_length=200)
    fallback_used: bool
    source_citations: list[str] = Field(default_factory=list, max_length=100)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroundedAIOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    answer: str = Field(min_length=1, max_length=200_000)
    citation_chunk_ids: list[str] = Field(alias="citationChunkIds", max_length=100)
    evidence_status: str = Field(alias="evidenceStatus", pattern="^(supported|insufficient_evidence)$")
