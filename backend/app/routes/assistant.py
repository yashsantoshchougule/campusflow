import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Form, Header, HTTPException
from pydantic import BaseModel, Field

from app.ai.provider import AIConfigurationError, AIInputError, AIUnavailableError
from app.auth import require_user
from app.config import settings
from app.services.dashboard_service import dashboard_service
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class DashboardQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


def raise_ai_http_error(error: Exception) -> None:
    if isinstance(error, AIConfigurationError):
        raise HTTPException(status_code=503, detail="AI backend configuration error") from error
    if isinstance(error, AIInputError):
        raise HTTPException(status_code=400, detail="AI request could not be processed") from error
    raise HTTPException(status_code=503, detail="AI temporarily unavailable") from error


@router.post("/dashboard-question")
async def dashboard_question(payload: DashboardQuestion, user: dict = Depends(require_user), authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    summary = await dashboard_service.summary(user, authorization)
    action = summary["nextBestAction"]
    answer = action["reason"] if action and "reason" in action else (action["reasons"][0] if action else "You are up to date. Add a task or timetable entry to get a recommendation.")
    metadata = {
        "model_used": None,
        "fallback_used": False,
        "source_citations": [],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    if settings.gemini_api_key:
        context = json.dumps({key: summary[key] for key in ("todayLectures", "assignments", "upcomingExams", "attendance", "importantNotices", "priorityTasks", "nextBestAction")})
        try:
            result = await gemini_service.generate_text(
                f"Answer this dashboard question concisely: {payload.question}",
                str(user["id"]),
                authorized_context=context,
                safety_instructions="Use only the verified dashboard context. Never invent academic facts, dates, marks, attendance, notices, or deadlines.",
            )
            answer = result.content
            metadata = result.model_dump(mode="json", exclude={"content"})
        except (AIConfigurationError, AIInputError, AIUnavailableError) as error:
            raise_ai_http_error(error)
    return {
        "answer": answer,
        "recommendedAction": action,
        "sources": ["timetable", "assignments", "examinations", "attendance", "notices", "priority rules"],
        **metadata,
    }


@router.post("/chat")
async def chat_with_assistant(
    message: str = Form(...),
    chat_history: Optional[str] = Form(None),
    context_notes: Optional[str] = Form(None),
    use_rag: bool = Form(True),
    isolate_message: bool = Form(False),
    user: dict = Depends(require_user),
):
    if not message.strip() or len(message) > 20_000:
        raise HTTPException(status_code=400, detail="Message must be between 1 and 20,000 characters")

    try:
        history = [] if isolate_message or not chat_history else json.loads(chat_history)
        if not isinstance(history, list):
            raise ValueError("Chat history must be a list")
        history_context = json.dumps(history[-10:])
        authorized_context = f"Conversation history:\n{history_context}"
        if use_rag and context_notes:
            authorized_context += f"\n\nSelected notes:\n{context_notes[:100_000]}"

        result = await gemini_service.generate_text(
            message,
            str(user["id"]),
            authorized_context=authorized_context,
            safety_instructions="Act as CampusFlow's study assistant. Use selected notes only as authorized context and never invent academic records or document sources.",
        )
        return {
            "response": result.content,
            "sources": [],
            **result.model_dump(mode="json", exclude={"content"}),
        }
    except HTTPException:
        raise
    except (json.JSONDecodeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except (AIConfigurationError, AIInputError, AIUnavailableError) as error:
        raise_ai_http_error(error)
