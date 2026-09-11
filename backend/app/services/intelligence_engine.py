from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
import json
from typing import Any, Literal

from pydantic import BaseModel

from app.services.attendance_engine import attendance_decision


Freshness = Literal["fresh", "partial", "stale"]


class StudentState(BaseModel):
    state_version: str
    generated_at: str
    data_freshness: Freshness
    missing_data: list[str]
    warnings: list[str]
    source_ids: list[str]
    profile: dict[str, Any]
    attendance: dict[str, Any]
    timetable: list[dict[str, Any]]
    assignments: list[dict[str, Any]]
    examinations: list[dict[str, Any]]
    tasks: list[dict[str, Any]]


def _source_ids(summary: dict[str, Any]) -> list[str]:
    groups = [
        summary.get("todayLectures", []),
        summary.get("assignments", {}).get("pending", []),
        summary.get("upcomingExams", []),
        summary.get("importantNotices", []),
        summary.get("studyTasks", {}).get("pending", []),
    ]
    ids = {str(row["id"]) for rows in groups for row in rows if row.get("id")}
    for subject in summary.get("attendance", {}).get("subjects", []):
        ids.update(str(value) for value in subject.get("sourceIds", []))
    return sorted(ids)


def _version(summary: dict[str, Any], source_ids: list[str]) -> str:
    # Include values that change when a task or attendance record changes, not wall-clock time.
    signature = {
        "sourceIds": source_ids,
        "attendance": summary.get("attendance"),
        "assignments": summary.get("assignments"),
        "tasks": summary.get("studyTasks"),
        "lectures": summary.get("todayLectures"),
        "exams": summary.get("upcomingExams"),
    }
    digest = sha256(json.dumps(signature, sort_keys=True, default=str, separators=(",", ":")).encode()).hexdigest()[:16]
    return f"v1-{digest}"


def _capacity(summary: dict[str, Any]) -> dict[str, Any]:
    pending = [*summary.get("assignments", {}).get("pending", []), *summary.get("studyTasks", {}).get("pending", [])]
    used_fallback = any(not row.get("estimatedMinutes") for row in pending)
    required = sum(int(row.get("estimatedMinutes") or 30) for row in pending)
    available = 180
    lectures = sorted(summary.get("todayLectures", []), key=lambda row: row.get("startTime", ""))
    conflicts = []
    for left, right in zip(lectures, lectures[1:]):
        if left.get("endTime", "") > right.get("startTime", ""):
            conflicts.append(f'{left.get("subject", "Lecture")} overlaps {right.get("subject", "lecture")}')
    return {
        "availableMinutes": available,
        "requiredMinutes": required,
        "surplusMinutes": available - required,
        "fixedCommitments": len(lectures),
        "movableItems": len(pending),
        "conflicts": conflicts,
        "usedFallbackEstimate": used_fallback,
        "assumption": "180 available study minutes and 30 minutes for items without an estimate" if used_fallback else "180 available study minutes",
    }


def build_intelligence(summary: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
    generated = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    source_ids = _source_ids(summary)
    missing = []
    if not summary.get("attendance", {}).get("subjects"):
        missing.append("attendance")
    if not summary.get("todayLectures"):
        missing.append("today_timetable")

    warnings = list(summary.get("attendance", {}).get("dataQualityWarnings", []))
    capacity = _capacity(summary)
    if capacity["usedFallbackEstimate"]:
        warnings.append("Capacity uses the visible 30-minute fallback for work without an estimate.")

    state = StudentState(
        state_version=_version(summary, source_ids),
        generated_at=generated.isoformat(),
        data_freshness="partial" if missing or warnings else "fresh",
        missing_data=missing,
        warnings=warnings,
        source_ids=source_ids,
        profile=summary.get("student", {}),
        attendance=summary.get("attendance", {}),
        timetable=summary.get("todayLectures", []),
        assignments=summary.get("assignments", {}).get("pending", []),
        examinations=summary.get("upcomingExams", []),
        tasks=summary.get("studyTasks", {}).get("pending", []),
    ).model_dump()

    next_action = summary.get("nextBestAction")
    bottleneck = None
    if next_action:
        bottleneck = {
            "entityId": next_action.get("targetId"),
            "entityType": next_action.get("type"),
            "title": next_action.get("title"),
            "score": next_action.get("score", 0),
            "reason": next_action.get("reason"),
            "sourceIds": [next_action.get("targetId")] if next_action.get("targetId") else [],
        }

    next_lecture = next((row for row in summary.get("todayLectures", []) if row.get("status") in {"ongoing", "upcoming"}), None)
    attendance_today = None
    if next_lecture:
        attendance_row = next((row for row in summary.get("attendance", {}).get("subjects", []) if row.get("subject") == next_lecture.get("subject")), None)
        if attendance_row:
            attendance_today = {
                "lecture": next_lecture,
                **attendance_decision(
                    int(attendance_row.get("presentClasses", 0)),
                    int(attendance_row.get("totalClasses", 0)),
                    attendance_row.get("threshold"),
                    source_ids=[next_lecture.get("id"), *attendance_row.get("sourceIds", [])],
                ),
                "policySource": "enrolled subject minimum_attendance_percentage",
                "confidence": "high" if not warnings else "medium",
            }

    why = None
    if next_action:
        why = {
            "recommendation": next_action.get("title"),
            "confidence": "high" if next_action.get("score", 0) >= 70 else "medium",
            "facts": list(next_action.get("reasons") or [next_action.get("reason")]),
            "inferences": ["This is the highest deterministic priority among current incomplete items."],
            "sourceIds": [next_action.get("targetId")] if next_action.get("targetId") else [],
            "reasonSummary": next_action.get("reason"),
        }

    return {
        "studentState": state,
        "risks": summary.get("academicRisk", {}),
        "dependencies": [],
        "bottleneck": bottleneck,
        "capacity": capacity,
        "nextBestAction": next_action,
        "attendanceToday": attendance_today,
        "why": why,
    }
