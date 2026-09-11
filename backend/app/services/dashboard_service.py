import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx
from fastapi import HTTPException

from app.config import settings
from app.services.attendance_engine import aggregate_records
from app.services.intelligence_engine import build_intelligence
from app.services.priority_engine import parse_time, priority_items
from app.services.risk_engine import academic_risk


class DashboardService:
    async def _request(self, method: str, table: str, token: str, *, params: dict | None = None, payload: dict | None = None, upsert: bool = False) -> list[dict]:
        prefer = "return=representation" + (",resolution=merge-duplicates" if upsert else "")
        headers = {"apikey": settings.supabase_publishable_key, "Authorization": token, "Content-Type": "application/json", "Prefer": prefer}
        async with httpx.AsyncClient(timeout=10, trust_env=False) as client:
            response = await client.request(method, f"{settings.supabase_url}/rest/v1/{table}", headers=headers, params=params, json=payload)
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Supabase {table} request failed")
        data = response.json() if response.content else []
        return data if isinstance(data, list) else [data]

    def _owned(self, table: str, user_id: str, token: str) -> Any:
        return self._request("GET", table, token, params={"select": "*", "user_id": f"eq.{user_id}"})

    async def _legacy_timetable(self, token: str) -> list[dict]:
        try:
            return await self._request("GET", "studybuddy_timetable_entries", token, params={"select": "*"})
        except HTTPException:
            return []

    @staticmethod
    def _date(row: dict) -> datetime | None:
        value = row.get("due_at") or row.get("due_date") or row.get("deadline") or row.get("deadline_at") or row.get("starts_at")
        if not value and row.get("exam_date"):
            value = f'{row["exam_date"]}T{row.get("start_time") or "00:00:00"}'
        return parse_time(value or row.get("date") or row.get("class_date"))

    @staticmethod
    def _done(row: dict) -> bool:
        return bool(row.get("completed")) or str(row.get("status", "")).lower() in {"completed", "submitted"}

    @staticmethod
    def _subject(row: dict, subjects: dict[str, dict]) -> tuple[str | None, str | None]:
        subject = subjects.get(str(row.get("subject_id")), {})
        return row.get("subject") or row.get("subject_name") or subject.get("name"), row.get("subject_code") or subject.get("code")

    def _task_view(self, row: dict, item_type: str, now: datetime, subjects: dict[str, dict]) -> dict:
        due = self._date(row)
        overdue = bool(due and due < now and not self._done(row))
        soon = bool(due and now <= due <= now + timedelta(hours=72))
        reason = "Overdue" if overdue else "Due soon" if soon else "Completed" if self._done(row) else "Pending"
        score = 100 if overdue else 70 if soon else 0 if self._done(row) else 40
        item_id = str(row.get("id", ""))
        subject, _ = self._subject(row, subjects)
        return {"id": item_id, "targetId": item_id, "type": item_type, "title": row.get("title") or item_type.replace("_", " ").title(), "subject": subject, "deadline": due.isoformat() if due else None, "score": score, "level": "critical" if score >= 90 else "high" if score >= 70 else "medium" if score else "low", "reason": reason, "reasons": [reason], "status": row.get("status") or ("completed" if self._done(row) else "pending"), "daysRemaining": (due.date() - now.date()).days if due else None, "estimatedMinutes": row.get("estimated_minutes"), "difficulty": row.get("difficulty"), "targetRoute": "/academics?tab=assignments" if item_type == "assignment" else "/tasks"}

    async def summary(self, user: dict, token: str) -> dict:
        user_id, now = str(user["id"]), datetime.now(timezone.utc)
        profile_rows = await self._request("GET", "profiles", token, params={"select": "*", "id": f"eq.{user_id}"})
        if len(profile_rows) != 1 or str(profile_rows[0].get("id")) != user_id:
            raise HTTPException(status_code=403, detail="Student profile mapping is unavailable")
        profile = profile_rows[0]
        try:
            local_zone = ZoneInfo(str(profile.get("timezone") or "Asia/Kolkata"))
        except ZoneInfoNotFoundError:
            local_zone = timezone.utc
        local_now = now.astimezone(local_zone)
        timetable, assignments, assignment_statuses, exams, attendance_records, notices, tasks, subject_rows, enrolments = await asyncio.gather(
            self._request("GET", "timetable_entries", token, params={"select": "*"}), self._request("GET", "assignments", token, params={"select": "*"}),
            self._owned("student_assignment_status", user_id, token), self._request("GET", "examinations", token, params={"select": "*"}), self._owned("attendance_records", user_id, token),
            self._request("GET", "notices", token, params={"select": "*"}), self._owned("todos", user_id, token), self._request("GET", "subjects", token, params={"select": "*"}),
            self._request("GET", "student_subjects", token, params={"select": "id,subject_id,updated_at", "user_id": f"eq.{user_id}", "enrolment_status": "eq.active"}),
        )
        if not timetable:
            timetable = await self._legacy_timetable(token)

        enrolled_subject_ids = {str(row.get("subject_id")) for row in enrolments}
        subjects = {str(row.get("id")): row for row in subject_rows if str(row.get("id")) in enrolled_subject_ids}
        attendance_records = [row for row in attendance_records if str(row.get("subject_id")) in enrolled_subject_ids]
        statuses = {str(row.get("assignment_id")): row for row in assignment_statuses}
        assignments = [{**row, **({"status": statuses[str(row.get("id"))].get("status"), "completed": self._done(statuses[str(row.get("id"))]), "completed_at": statuses[str(row.get("id"))].get("completed_at")} if str(row.get("id")) in statuses else {})} for row in assignments]
        current_time, weekday = local_now.strftime("%H:%M"), local_now.strftime("%A").lower()
        day_number, today = (local_now.weekday() + 1) % 7, local_now.date().isoformat()
        lectures = []
        for row in timetable:
            named_day = str(row.get("day") or row.get("weekday") or "").lower()
            if not (named_day == weekday or row.get("day_of_week") == day_number or str(row.get("specific_date") or "") == today):
                continue
            start, end = str(row.get("start_time", ""))[:5], str(row.get("end_time", ""))[:5]
            status = "completed" if end and end <= current_time else "current" if start <= current_time < end else "upcoming"
            subject, subject_code = self._subject(row, subjects)
            lectures.append({"id": str(row.get("id")), "subject": subject or "Untitled", "subjectCode": subject_code, "startTime": start, "endTime": end, "facultyName": row.get("faculty_name"), "location": row.get("location"), "onlineLink": row.get("online_link"), "status": "ongoing" if status == "current" else status})
        lectures.sort(key=lambda row: row["startTime"])

        pending_assignments = [row for row in assignments if not self._done(row)]
        overdue_assignments = [row for row in pending_assignments if self._date(row) and self._date(row) < now]
        due_soon = [row for row in pending_assignments if self._date(row) and now <= self._date(row) <= now + timedelta(hours=72)]
        pending_tasks = [row for row in tasks if not self._done(row)]
        overdue_tasks = [row for row in pending_tasks if self._date(row) and self._date(row) < now]

        default_threshold = float(profile.get("minimum_attendance_percentage") or 75)
        thresholds = {str(row.get("name")): float(row.get("minimum_attendance_percentage") or default_threshold) for row in subject_rows}
        named_attendance = [{**row, "subject": self._subject(row, subjects)[0] or "General"} for row in attendance_records]
        attendance = aggregate_records(named_attendance, default_threshold, thresholds)

        upcoming_exams = [row for row in exams if self._date(row) and self._date(row) >= now]
        upcoming_exams.sort(key=lambda row: self._date(row))
        important_notices = []
        for row in notices:
            deadline, created = parse_time(row.get("deadline") or row.get("due_at") or row.get("deadline_at")), parse_time(row.get("published_at") or row.get("created_at"))
            priority = str(row.get("priority", "normal")).lower()
            if row.get("important") or priority in {"high", "urgent"} or (deadline and deadline >= now) or (created and created >= now - timedelta(days=7)):
                important_notices.append(row)
        important_notices.sort(key=lambda row: (self._date(row) is None, self._date(row) or datetime.max.replace(tzinfo=timezone.utc)))

        named_assignments = [{**row, "subject": self._subject(row, subjects)[0]} for row in pending_assignments]
        named_exams = [{**row, "subject": self._subject(row, subjects)[0]} for row in upcoming_exams]
        priorities = priority_items(named_assignments, named_exams, attendance["subjects"], important_notices, pending_tasks, now)
        week_start = (local_now - timedelta(days=local_now.weekday())).date()
        week_end = week_start + timedelta(days=6)
        weekly_rows = []
        for row in assignments + tasks:
            event_time = parse_time(row.get("due_at") or row.get("due_date") or row.get("scheduled_for") or row.get("created_at"))
            if event_time and week_start <= event_time.astimezone(local_zone).date() <= week_end:
                weekly_rows.append(row)
        completed_count = sum(self._done(row) for row in weekly_rows)
        subject_progress = []
        for subject in sorted({str(row.get("subject") or "General") for row in weekly_rows}):
            rows = [row for row in weekly_rows if str(row.get("subject") or "General") == subject]
            complete = sum(self._done(row) for row in rows)
            subject_progress.append({"subject": subject, "completedTasks": complete, "totalTasks": len(rows), "percentage": round(complete * 100 / len(rows))})

        assignment_view = [self._task_view(row, "assignment", now, subjects) for row in pending_assignments]
        task_view = [self._task_view(row, "study_task", now, subjects) for row in tasks]
        action = priorities[0].copy() if priorities else None
        if action:
            action["type"] = {"assignment": "complete_assignment", "exam": "prepare_for_exam", "attendance": "recover_attendance", "notice": "read_notice", "study_task": "start_study_session"}.get(action["type"], action["type"])
            action["explanation"] = action["reason"]
        return {
            "student": {"id": user_id, "fullName": profile.get("full_name") or user.get("email", "Student").split("@")[0], "currentDate": local_now.strftime("%A, %d %B %Y"), "semester": profile.get("semester"), "course": profile.get("course")},
            "todayLectures": lectures,
            "assignments": {"pending": assignment_view, "overdue": [self._task_view(row, "assignment", now, subjects) for row in overdue_assignments], "dueSoon": [self._task_view(row, "assignment", now, subjects) for row in due_soon], "pendingCount": len(pending_assignments), "overdueCount": len(overdue_assignments)},
            "upcomingExams": [{"id": str(row.get("id")), "title": row.get("title") or row.get("name") or "Exam", "subject": self._subject(row, subjects)[0], "startsAt": self._date(row).isoformat(), "daysRemaining": (self._date(row).date() - now.date()).days, "examType": row.get("exam_type"), "syllabus": row.get("syllabus") or row.get("topics"), "preparationProgress": row.get("preparation_progress")} for row in upcoming_exams[:5]],
            "attendance": attendance,
            "importantNotices": [{"id": str(row.get("id")), "title": row.get("title", "Notice"), "deadline": row.get("deadline") or row.get("due_at") or row.get("deadline_at"), "summary": row.get("summary") or row.get("description") or row.get("body"), "category": row.get("category") or row.get("issuing_department"), "sourceDocumentUrl": row.get("source_document_url"), "updatedAt": row.get("updated_at"), "importance": row.get("priority", "important"), "targetRoute": "/notices"} for row in important_notices[:5]],
            "priorityTasks": priorities[:10], "academicRisk": academic_risk(priorities, attendance["subjectWarnings"]), "nextBestAction": action,
            "studyTasks": {"pending": [row for row in task_view if row["reason"] != "Completed"], "overdue": [self._task_view(row, "study_task", now, subjects) for row in overdue_tasks], "completedCount": sum(self._done(row) for row in tasks), "pendingCount": len(pending_tasks)},
            "weeklyProgress": {"completedTasks": completed_count, "pendingTasks": len(weekly_rows) - completed_count, "totalTasks": len(weekly_rows), "percentage": round(completed_count * 100 / len(weekly_rows)) if weekly_rows else 0, "subjectProgress": subject_progress},
        }

    async def create(self, table: str, user_id: str, token: str, payload: dict) -> dict:
        rows = await self._request("POST", table, token, payload={**payload, "user_id": user_id})
        return rows[0]

    async def update(self, table: str, record_id: str, user_id: str, token: str, payload: dict) -> dict:
        rows = await self._request("PATCH", table, token, params={"id": f"eq.{record_id}", "user_id": f"eq.{user_id}"}, payload={**payload, "updated_at": datetime.now(timezone.utc).isoformat()})
        if not rows:
            raise HTTPException(status_code=404, detail="Record not found")
        return rows[0]

    async def complete_assignment(self, assignment_id: str, user_id: str, token: str) -> dict:
        rows = await self._request("GET", "assignments", token, params={"select": "*", "id": f"eq.{assignment_id}"})
        if not rows:
            raise HTTPException(status_code=404, detail="Assignment not found")
        assignment = rows[0]
        completed_at = datetime.now(timezone.utc).isoformat()
        if assignment.get("user_id") == user_id or (assignment.get("created_by") == user_id and assignment.get("visibility") == "personal"):
            return await self.update("assignments", assignment_id, user_id, token, {"completed": True, "status": "completed", "completed_at": completed_at})
        existing = await self._request("GET", "student_assignment_status", token, params={"select": "id", "assignment_id": f"eq.{assignment_id}", "user_id": f"eq.{user_id}"})
        payload = {"assignment_id": assignment_id, "user_id": user_id, "status": "completed", "completed_at": completed_at}
        if existing:
            updated = await self._request("PATCH", "student_assignment_status", token, params={"id": f'eq.{existing[0]["id"]}', "user_id": f"eq.{user_id}"}, payload=payload)
        else:
            updated = await self._request("POST", "student_assignment_status", token, payload=payload)
        return updated[0]

    async def upsert_attendance(self, user_id: str, token: str, payload: dict) -> dict:
        enrolments = await self._request("GET", "student_subjects", token, params={"select": "subject:subjects(id,name)", "user_id": f"eq.{user_id}", "enrolment_status": "eq.active"})
        subject = next((row.get("subject") for row in enrolments if row.get("subject") and str(row["subject"].get("name", "")).casefold() == payload["subject"].casefold()), None)
        if not subject:
            raise HTTPException(status_code=422, detail="Select an enrolled subject")
        subject_id = subject["id"]
        key = {"user_id": f"eq.{user_id}", "subject_id": f"eq.{subject_id}", "class_date": f'eq.{payload["date"]}', "class_start_time": "is.null"}
        existing = await self._request("GET", "attendance_records", token, params={"select": "id", **key})
        values = {**payload, "user_id": user_id, "subject_id": subject_id, "class_date": payload["date"], "recorded_by": user_id, "source_type": "student", "verification_status": "pending"}
        if existing:
            rows = await self._request("PATCH", "attendance_records", token, params={"id": f'eq.{existing[0]["id"]}', "user_id": f"eq.{user_id}"}, payload=values)
        else:
            rows = await self._request("POST", "attendance_records", token, payload=values)
        return rows[0]

    async def intelligence(self, user: dict, token: str) -> dict:
        return build_intelligence(await self.summary(user, token))

    async def simulate_attendance(self, user: dict, token: str, subject_id: str, attended: int, missed: int) -> dict:
        summary = await self.summary(user, token)
        subject = next((row for row in summary["attendance"]["subjects"] if str(row.get("id")) == subject_id), None)
        if not subject:
            raise HTTPException(status_code=404, detail="Attendance subject not found")
        from app.services.attendance_engine import attendance_decision, forecast

        projection = forecast(subject["presentClasses"], subject["totalClasses"], attended=attended, missed=missed, threshold=subject["threshold"])
        return {**projection, "decision": attendance_decision(projection["presentClasses"], projection["totalClasses"], subject["threshold"], source_ids=subject.get("sourceIds", [])), "mutated": False}

    async def complete_next_action(self, user: dict, token: str, task_id: str, expected_state_version: str | None) -> dict:
        user_id = str(user["id"])
        before = await self.intelligence(user, token)
        if expected_state_version and expected_state_version != before["studentState"]["state_version"]:
            raise HTTPException(status_code=409, detail="Student state changed; refresh before applying this action")
        rows = await self._request("GET", "todos", token, params={"select": "*", "id": f"eq.{task_id}", "user_id": f"eq.{user_id}"})
        if not rows:
            raise HTTPException(status_code=404, detail="Action target not found")
        if not rows[0].get("completed"):
            await self.update("todos", task_id, user_id, token, {"completed": True})
        after = await self.intelligence(user, token)
        return {"entityId": task_id, "completed": True, "beforeStateVersion": before["studentState"]["state_version"], "afterStateVersion": after["studentState"]["state_version"], "intelligence": after}


dashboard_service = DashboardService()
