from typing import Any


def academic_risk(priority_tasks: list[dict], attendance_warnings: list[dict]) -> dict[str, Any]:
    reasons: list[str] = []
    score = 0
    overdue = sum(task["score"] >= 100 for task in priority_tasks)
    soon = sum(task["score"] in {70, 90} and task["type"] in {"assignment", "study_task"} for task in priority_tasks)
    exams = sum(task["type"] == "exam" and task["score"] == 85 for task in priority_tasks)
    notice_deadlines = sum(task["type"] == "notice" for task in priority_tasks)
    no_safe_bunks = sum(task["type"] == "attendance" and task["score"] == 55 for task in priority_tasks)
    if overdue: score += min(40, overdue * 15); reasons.append(f"{overdue} overdue task(s)")
    if soon: score += min(20, soon * 5); reasons.append(f"{soon} task(s) due soon")
    if attendance_warnings: score += min(25, len(attendance_warnings) * 10); reasons.append("Attendance is below target")
    if exams: score += min(15, exams * 8); reasons.append("Exam is within 3 days")
    if no_safe_bunks: score += min(10, no_safe_bunks * 5); reasons.append("No safe bunks remain")
    if notice_deadlines: score += min(10, notice_deadlines * 5); reasons.append("Important notice deadline is near")
    score = min(100, score)
    level = "critical" if score >= 75 else "high" if score >= 50 else "moderate" if score >= 25 else "safe"
    action = "Open the highest-priority dashboard item." if reasons else "Keep your academic plan up to date."
    return {"level": level, "score": score, "reasons": reasons, "recommendedAction": action}
