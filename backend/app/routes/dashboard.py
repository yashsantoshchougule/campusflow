from datetime import date, datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.auth import require_user
from app.services.dashboard_service import dashboard_service
from app.services.intelligence_engine import build_intelligence

router = APIRouter(prefix="/api", tags=["dashboard"])
User = Annotated[dict, Depends(require_user)]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=240)]
Subject = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]

def token_from(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(status_code=401, detail="Authentication required")
    return authorization

class AssignmentBody(BaseModel):
    title: Title
    subject: Subject | None = None
    dueAt: datetime
    description: str | None = Field(default=None, max_length=5000)
class AttendanceBody(BaseModel):
    subject: Subject
    date: date
    status: Literal["present", "absent"]
class StudyTaskBody(BaseModel):
    title: Title
    subject: Subject | None = None
    dueAt: datetime | None = None
    scheduledFor: date | None = None
    reminderAt: datetime | None = None
class CompleteBody(BaseModel):
    completed: Literal[True]
class StudyTaskUpdate(BaseModel):
    title: Title | None = None
    subject: Subject | None = None
    dueAt: datetime | None = None
    scheduledFor: date | None = None
    completed: bool | None = None

class StrictBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

class AttendanceSimulationBody(StrictBody):
    subjectId: str = Field(min_length=1, max_length=100)
    attended: int = Field(default=0, ge=0, le=1000)
    missed: int = Field(default=0, ge=0, le=1000)

class CompleteActionBody(StrictBody):
    taskId: str = Field(min_length=1, max_length=100)
    expectedStateVersion: str | None = Field(default=None, max_length=64)

@router.get("/dashboard/summary")
async def get_summary(user: User, authorization: Annotated[str | None, Header()] = None):
    return await dashboard_service.summary(user, token_from(authorization))

@router.get("/dashboard/ai-summary")
async def get_ai_summary(user: User, authorization: Annotated[str | None, Header()] = None):
    token = token_from(authorization)
    summary = await dashboard_service.summary(user, token)
    return {**summary, **build_intelligence(summary)}

@router.get("/intelligence/state")
async def get_student_state(user: User, authorization: Annotated[str | None, Header()] = None):
    return (await dashboard_service.intelligence(user, token_from(authorization)))["studentState"]

@router.get("/intelligence/risks")
async def get_risks(user: User, authorization: Annotated[str | None, Header()] = None):
    return (await dashboard_service.intelligence(user, token_from(authorization)))["risks"]

@router.get("/intelligence/bottleneck")
async def get_bottleneck(user: User, authorization: Annotated[str | None, Header()] = None):
    return (await dashboard_service.intelligence(user, token_from(authorization)))["bottleneck"]

@router.get("/intelligence/capacity")
async def get_capacity(user: User, authorization: Annotated[str | None, Header()] = None):
    return (await dashboard_service.intelligence(user, token_from(authorization)))["capacity"]

@router.get("/intelligence/next-action")
async def get_next_action(user: User, authorization: Annotated[str | None, Header()] = None):
    result = await dashboard_service.intelligence(user, token_from(authorization))
    return {"action": result["nextBestAction"], "why": result["why"], "stateVersion": result["studentState"]["state_version"]}

@router.get("/attendance/summary")
async def get_attendance_summary(user: User, authorization: Annotated[str | None, Header()] = None):
    return (await dashboard_service.summary(user, token_from(authorization)))["attendance"]

@router.get("/attendance/today")
async def get_attendance_today(user: User, authorization: Annotated[str | None, Header()] = None):
    return (await dashboard_service.intelligence(user, token_from(authorization)))["attendanceToday"]

@router.post("/attendance/simulate")
async def simulate_attendance(body: AttendanceSimulationBody, user: User, authorization: Annotated[str | None, Header()] = None):
    return await dashboard_service.simulate_attendance(user, token_from(authorization), body.subjectId, body.attended, body.missed)

@router.post("/actions/complete")
async def complete_action(body: CompleteActionBody, user: User, authorization: Annotated[str | None, Header()] = None):
    return await dashboard_service.complete_next_action(user, token_from(authorization), body.taskId, body.expectedStateVersion)

@router.post("/assignments", status_code=201)
async def create_assignment(body: AssignmentBody, user: User, authorization: Annotated[str | None, Header()] = None):
    user_id = str(user["id"])
    return await dashboard_service.create("assignments", user_id, token_from(authorization), {"title": body.title, "subject": body.subject, "due_at": body.dueAt.isoformat(), "description": body.description, "completed": False, "created_by": user_id, "visibility": "personal", "source_type": "student", "verification_status": "verified"})

@router.patch("/assignments/{assignment_id}")
async def complete_assignment(assignment_id: str, body: CompleteBody, user: User, authorization: Annotated[str | None, Header()] = None):
    return await dashboard_service.complete_assignment(assignment_id, str(user["id"]), token_from(authorization))

@router.post("/attendance/quick-update", status_code=201)
async def quick_attendance(body: AttendanceBody, user: User, authorization: Annotated[str | None, Header()] = None):
    return await dashboard_service.upsert_attendance(str(user["id"]), token_from(authorization), {"subject": body.subject, "date": body.date.isoformat(), "status": body.status})

@router.post("/study-tasks", status_code=201)
async def create_study_task(body: StudyTaskBody, user: User, authorization: Annotated[str | None, Header()] = None):
    token = token_from(authorization)
    task = await dashboard_service.create("study_tasks", str(user["id"]), token, {"title": body.title, "subject": body.subject, "due_at": body.dueAt.isoformat() if body.dueAt else None, "scheduled_for": body.scheduledFor.isoformat() if body.scheduledFor else None, "completed": False})
    if body.reminderAt: await dashboard_service.create("reminders", str(user["id"]), token, {"study_task_id": task["id"], "source_entity_id": task["id"], "source_entity_type": "study_task", "remind_at": body.reminderAt.isoformat(), "scheduled_at": body.reminderAt.isoformat(), "title": body.title})
    return task

@router.patch("/study-tasks/{task_id}")
async def update_study_task(task_id: str, body: StudyTaskUpdate, user: User, authorization: Annotated[str | None, Header()] = None):
    values = body.model_dump(exclude_unset=True)
    payload = {key: values[key] for key in ("title", "subject", "completed") if key in values}
    if "dueAt" in values: payload["due_at"] = values["dueAt"].isoformat() if values["dueAt"] else None
    if "scheduledFor" in values: payload["scheduled_for"] = values["scheduledFor"].isoformat() if values["scheduledFor"] else None
    if not payload: raise HTTPException(status_code=400, detail="At least one update is required")
    if values.get("completed") is True: payload["completed_at"] = datetime.now(timezone.utc).isoformat()
    if values.get("completed") is False: payload["completed_at"] = None
    return await dashboard_service.update("study_tasks", task_id, str(user["id"]), token_from(authorization), payload)
