from datetime import datetime, timezone
from typing import Any


def parse_time(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def priority_items(assignments: list[dict], exams: list[dict], attendance: list[dict], notices: list[dict], tasks: list[dict], now: datetime | None = None) -> list[dict]:
    now = now or datetime.now(timezone.utc)
    result: list[dict] = []
    def add(item_type: str, row: dict, score: int, reason: str, route: str, deadline: Any = None):
        if score:
            item_id = str(row.get("id", ""))
            title = row.get("title") or row.get("name") or row.get("subject") or item_type.title()
            suggested = {"assignment": "Complete the assignment.", "exam": "Start exam preparation.", "attendance": "Attend the next scheduled class.", "notice": "Read and act on the notice.", "study_task": "Start the study task."}.get(item_type, "Open this item.")
            explanation = f"{title}: {reason.lower()}."
            result.append({"id": item_id, "targetId": item_id, "type": item_type, "title": title, "subject": row.get("subject") or row.get("subject_name"), "score": score, "level": "critical" if score >= 90 else "high" if score >= 70 else "medium", "deadline": deadline, "reason": explanation, "reasons": [explanation], "suggestedAction": suggested, "targetRoute": route})
    def score_work(rows: list[dict], item_type: str, route: str):
        for row in rows:
            if row.get("completed") or str(row.get("status", "")).lower() in {"completed", "submitted"}: continue
            due = parse_time(row.get("due_at") or row.get("due_date") or row.get("deadline"))
            if due and due < now: add(item_type, row, 100, "Overdue", route, due.isoformat())
            elif due and (due - now).total_seconds() <= 24 * 3600: add(item_type, row, 90, "Due within 24 hours", route, due.isoformat())
            elif due and (due - now).total_seconds() <= 72 * 3600: add(item_type, row, 70, "Due within 3 days", route, due.isoformat())
            elif item_type == "study_task": add(item_type, row, 40, "Incomplete study task", route)
    score_work(assignments, "assignment", "/assignments")
    score_work(tasks, "study_task", "/todos")
    for row in exams:
        starts = parse_time(row.get("starts_at") or row.get("exam_date") or row.get("date"))
        if starts and starts >= now:
            days = (starts - now).total_seconds() / 86400
            if days <= 3: add("exam", row, 85, "Exam within 3 days", "/exams", starts.isoformat())
            elif days <= 7: add("exam", row, 65, "Exam within 7 days", "/exams", starts.isoformat())
    for row in attendance:
        percentage, threshold = row.get("percentage"), row.get("threshold", 75)
        if isinstance(percentage, (int, float)) and percentage < threshold: add("attendance", row, 80, f"Attendance below {threshold}%", "/attendance")
        elif row.get("safeBunks", row.get("safe_bunks")) == 0: add("attendance", row, 55, "No safe bunks remaining", "/attendance")
    for row in notices:
        deadline = parse_time(row.get("deadline") or row.get("due_at"))
        important = row.get("important") or str(row.get("priority", "")).lower() in {"high", "urgent"}
        if important and deadline and 0 <= (deadline - now).total_seconds() <= 3 * 86400: add("notice", row, 75, "Important notice deadline within 3 days", "/notices", deadline.isoformat())
    return sorted(result, key=lambda item: (-item["score"], item["title"]))
