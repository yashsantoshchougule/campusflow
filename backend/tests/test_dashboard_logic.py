from datetime import datetime, timedelta, timezone

import asyncio
from pydantic import ValidationError

from app.routes.dashboard import AttendanceSimulationBody
from app.services.attendance_engine import absence_impact, aggregate_records, attendance_decision, attendance_percentage, attendance_status, required_classes, safe_bunks
from app.services.dashboard_service import DashboardService
from app.services.intelligence_engine import build_intelligence
from app.services.priority_engine import priority_items
from app.services.risk_engine import academic_risk


def test_priority_risk_and_next_action():
    now = datetime.now(timezone.utc)
    tasks = priority_items(
        [{"id": "a", "title": "Past due", "due_at": (now - timedelta(hours=1)).isoformat()}],
        [{"id": "e", "title": "Exam", "starts_at": (now + timedelta(days=2)).isoformat()}],
        [{"subject": "Math", "percentage": 60, "threshold": 75}], [], [], now,
    )
    assert tasks[0]["title"] == "Past due" and tasks[0]["score"] == 100
    assert "overdue" in tasks[0]["reason"].lower() and tasks[0]["targetId"] == "a"
    risk = academic_risk(tasks, [{"subject": "Math"}])
    assert risk["score"] >= 25 and risk["level"] in {"moderate", "high", "critical"}


class FakeDashboard(DashboardService):
    async def _request(self, method, table, token, *, params=None, payload=None, upsert=False):
        if table == "profiles": return [{"id": "owner", "full_name": "Owner", "minimum_attendance_percentage": 75}]
        if table == "subjects": return [{"id": "math", "name": "Math", "minimum_attendance_percentage": 75}]
        if table == "student_subjects": return [{"id": "enrolment", "subject_id": "math"}]
        if table == "student_assignment_status": return []
        return await self._owned(table, "owner", token)

    async def _owned(self, table, user_id, token):
        assert user_id == "owner"  # service never accepts an arbitrary user id
        now = datetime.now(timezone.utc)
        if table == "timetable_entries": return [{"id": "lecture", "day": now.strftime("%A"), "subject": "Math", "start_time": "09:00", "end_time": "10:00"}]
        if table == "assignments": return [{"id": "late", "title": "Late", "due_at": (now - timedelta(hours=1)).isoformat()}, {"id": "soon", "title": "Soon", "due_at": (now + timedelta(hours=2)).isoformat()}, {"id": "done", "title": "Done", "completed": True, "due_at": (now + timedelta(days=1)).isoformat()}]
        if table == "examinations": return [{"id": "far", "title": "Far", "starts_at": (now + timedelta(days=6)).isoformat()}, {"id": "near", "title": "Near", "starts_at": (now + timedelta(days=2)).isoformat()}]
        if table == "attendance_records": return [{"id": "mine-1", "subject_id": "math", "subject": "Math", "status": "present"}, {"id": "mine-2", "subject_id": "math", "subject": "Math", "status": "absent"}]
        return []


class FakeMutations(DashboardService):
    def __init__(self):
        self.writes = []

    async def _request(self, method, table, token, *, params=None, payload=None, upsert=False):
        if table == "student_subjects": return [{"subject": {"id": "math", "name": "Math"}}]
        if method == "GET": return []
        self.writes.append((table, payload))
        return [{"id": "saved", **payload}]


def test_extracted_attendance_formulas_and_forecast():
    assert attendance_percentage(30, 40) == 75
    assert safe_bunks(32, 40, 75) == 2
    assert required_classes(20, 40, 75) == 40
    assert attendance_status(30, 40, 75) == "warning"
    assert attendance_status(749_999, 999_999, 75) == "danger"  # 74.999975% displays 75.00 but remains below.
    assert absence_impact(30, 40, 1, 75)["percentage"] == 73.17
    summary = aggregate_records([{"subject": "Math", "status": "present"}, {"subject": "Math", "status": "absent"}, {"subject": "Physics", "status": "present"}], 75)
    assert summary["overallPercentage"] == 66.67
    assert summary["atRiskSubjects"] == ["Math"]
    assert required_classes(9, 10, 100) is None
    assert required_classes(0, 10, 0) == 0
    assert attendance_decision(9, 10, 75)["status"] == "ABOVE_BUFFER"
    assert attendance_decision(3, 4, 75)["status"] == "ATTEND_RECOMMENDED"
    assert attendance_decision(2, 4, 75)["status"] == "MUST_ATTEND"
    assert attendance_decision(0, 0, 75)["status"] == "INSUFFICIENT_DATA"
    assert attendance_decision(3, 4, 75, countable=False)["status"] == "NOT_COUNTABLE_OR_CANCELLED"


def test_summary_filters_and_calculates_for_current_user():
    summary = asyncio.run(FakeDashboard().summary({"id": "owner", "email": "owner@example.com"}, "Bearer test"))
    assert summary["student"]["id"] == "owner" and len(summary["todayLectures"]) == 1
    assert summary["assignments"]["overdueCount"] == 1 and len(summary["assignments"]["dueSoon"]) == 1
    assert [exam["title"] for exam in summary["upcomingExams"]] == ["Near", "Far"]
    assert summary["attendance"]["overallPercentage"] == 50 and summary["attendance"]["atRiskSubjects"] == ["Math"]
    assert "overdue" in summary["nextBestAction"]["reason"].lower()


def test_quick_actions_write_verified_owner_only():
    service = FakeMutations()
    assignment = asyncio.run(service.create("assignments", "owner", "Bearer test", {"title": "Lab"}))
    attendance = asyncio.run(service.upsert_attendance("owner", "Bearer test", {"subject": "Math", "date": "2026-09-10", "status": "present"}))
    assert assignment["user_id"] == "owner"
    assert attendance["user_id"] == attendance["recorded_by"] == "owner"
    assert attendance["subject_id"] == "math" and attendance["source_type"] == "student"
    assert attendance["verification_status"] == "pending"


class TwoStudentDashboard(DashboardService):
    def __init__(self):
        self.records = {
            "alice": [{"id": "alice-attendance", "user_id": "alice", "subject_id": "math", "status": "present"}],
            "bob": [{"id": "bob-attendance", "user_id": "bob", "subject_id": "math", "status": "absent"}],
        }
        self.todos = {
            "alice": [{"id": "alice-task", "user_id": "alice", "title": "Review Math", "completed": False, "updated_at": "2026-09-11T00:00:00Z"}],
            "bob": [{"id": "bob-task", "user_id": "bob", "title": "Review Math", "completed": False, "updated_at": "2026-09-11T00:00:00Z"}],
        }

    @staticmethod
    def _owner(params):
        value = (params or {}).get("user_id", "")
        return value[3:] if value.startswith("eq.") else None

    async def _request(self, method, table, token, *, params=None, payload=None, upsert=False):
        owner = self._owner(params)
        if table == "profiles":
            profile_id = str((params or {}).get("id", ""))[3:]
            return [{"id": profile_id, "full_name": profile_id.title(), "minimum_attendance_percentage": 75, "timezone": "UTC"}]
        if table == "subjects": return [{"id": "math", "name": "Math", "minimum_attendance_percentage": 75}]
        if table == "student_subjects": return [{"id": f"{owner}-enrolment", "subject_id": "math"}]
        if table == "attendance_records": return [dict(row) for row in self.records.get(owner, [])]
        if table == "todos":
            rows = self.todos.get(owner, [])
            record_id = str((params or {}).get("id", ""))[3:]
            if record_id: rows = [row for row in rows if row["id"] == record_id]
            if method == "PATCH" and rows:
                rows[0].update(payload or {})
            return [dict(row) for row in rows]
        return []


def test_two_students_are_isolated_and_closed_loop_recalculates():
    service = TwoStudentDashboard()
    alice = asyncio.run(service.summary({"id": "alice", "email": "alice@example.com"}, "Bearer alice"))
    bob = asyncio.run(service.summary({"id": "bob", "email": "bob@example.com"}, "Bearer bob"))
    alice_state, bob_state = build_intelligence(alice), build_intelligence(bob)
    assert "alice-attendance" in alice_state["studentState"]["source_ids"]
    assert "bob-attendance" not in alice_state["studentState"]["source_ids"]
    assert "bob-attendance" in bob_state["studentState"]["source_ids"]
    result = asyncio.run(service.complete_next_action({"id": "alice", "email": "alice@example.com"}, "Bearer alice", "alice-task", alice_state["studentState"]["state_version"]))
    assert result["completed"] is True
    assert result["beforeStateVersion"] != result["afterStateVersion"]
    assert service.todos["bob"][0]["completed"] is False


def test_attendance_request_rejects_identity_override():
    try:
        AttendanceSimulationBody.model_validate({"subjectId": "math", "attended": 1, "user_id": "bob"})
        raise AssertionError("identity override was accepted")
    except ValidationError:
        pass


if __name__ == "__main__":
    test_priority_risk_and_next_action()
    test_extracted_attendance_formulas_and_forecast()
    test_summary_filters_and_calculates_for_current_user()
    test_quick_actions_write_verified_owner_only()
    test_two_students_are_isolated_and_closed_loop_recalculates()
    test_attendance_request_rejects_identity_override()
    print("dashboard logic: ok")
