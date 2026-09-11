from collections import defaultdict
from datetime import date, timedelta
from fractions import Fraction
from math import ceil, floor


def attendance_percentage(present: int, total: int) -> float:
    return round(min(100, max(0, present / total * 100)), 2) if total > 0 else 0.0


def safe_bunks(present: int, total: int, threshold: float) -> int:
    if total <= 0 or threshold <= 0 or threshold > 100:
        return 0
    target = Fraction(str(threshold))
    return max(0, floor((present * 100 - target * total) / target))


def required_classes(present: int, total: int, threshold: float) -> int | None:
    if threshold <= 0 or threshold > 100:
        return 0
    target = Fraction(str(threshold))
    if present * 100 >= target * total:
        return 0
    if threshold == 100:
        return None
    return max(0, ceil((target * total - present * 100) / (100 - target)))


def attendance_status(present: int, total: int, threshold: float) -> str:
    if total <= 0:
        return "warning"
    if present * 100 < Fraction(str(threshold)) * total:
        return "danger"
    return "safe" if safe_bunks(present, total, threshold) > 0 else "warning"


def forecast(present: int, total: int, *, attended: int = 0, missed: int = 0, threshold: float = 75) -> dict:
    next_present, next_total = max(0, present + attended), max(0, total + attended + missed)
    return {"presentClasses": next_present, "totalClasses": next_total, "percentage": attendance_percentage(next_present, next_total), "safeBunks": safe_bunks(next_present, next_total, threshold), "requiredClasses": required_classes(next_present, next_total, threshold), "status": attendance_status(next_present, next_total, threshold)}


def absence_impact(present: int, total: int, missed_classes: int, threshold: float = 75) -> dict:
    return forecast(present, total, missed=max(0, missed_classes), threshold=threshold)


def attendance_decision(
    present: int,
    total: int,
    threshold: float | None,
    *,
    safety_buffer: float = 5,
    countable: bool = True,
    source_ids: list[str] | None = None,
) -> dict:
    """Classify a lecture from exact counts; percentages are display-only."""
    sources = sorted(set(source_ids or []))
    if not countable:
        return {"status": "NOT_COUNTABLE_OR_CANCELLED", "reason": "This lecture is cancelled or is not confirmed as countable.", "sourceIds": sources}
    if total <= 0 or threshold is None or threshold < 0 or threshold > 100:
        return {"status": "INSUFFICIENT_DATA", "reason": "A countable attendance denominator and official threshold are required.", "sourceIds": sources}

    target = Fraction(str(threshold))
    safety_target = min(Fraction(100), target + Fraction(str(max(0, safety_buffer))))
    below_official = present * 100 < target * total
    miss_below_official = present * 100 < target * (total + 1)
    miss_above_buffer = present * 100 >= safety_target * (total + 1)
    if below_official:
        status, reason = "MUST_ATTEND", "Attendance is below the official threshold; missing increases the recovery required."
    elif miss_below_official:
        status, reason = "ATTEND_RECOMMENDED", "Missing this lecture would move attendance below the official threshold."
    elif miss_above_buffer:
        status, reason = "ABOVE_BUFFER", "Attendance is projected to remain above your selected safety buffer if you miss; attending may still be academically beneficial."
    else:
        status, reason = "ATTEND_RECOMMENDED", "Missing this lecture would use the selected safety buffer."
    return {
        "status": status,
        "reason": reason,
        "presentClasses": present,
        "totalClasses": total,
        "currentPercentage": attendance_percentage(present, total),
        "afterAttending": attendance_percentage(present + 1, total + 1),
        "afterMissing": attendance_percentage(present, total + 1),
        "officialThreshold": float(target),
        "safetyTarget": float(safety_target),
        "safeBunks": safe_bunks(present, total, float(safety_target)),
        "recoveryClasses": required_classes(present, total, float(target)),
        "sourceIds": sources,
    }


def scheduled_absences(entries: list[dict], subject: str, from_date: date, to_date: date) -> int:
    if from_date > to_date:
        return 0
    weekdays = {str(entry.get("day", "")).lower() for entry in entries if entry.get("subject") == subject}
    current, count = from_date, 0
    while current <= to_date:
        count += current.strftime("%A").lower() in weekdays
        current += timedelta(days=1)
    return count


def aggregate_records(records: list[dict], default_threshold: float = 75, subject_thresholds: dict[str, float] | None = None) -> dict:
    grouped: dict[tuple[str, str], list[bool]] = defaultdict(list)
    source_ids: dict[tuple[str, str], list[str]] = defaultdict(list)
    unknown_statuses: set[str] = set()
    for record in records:
        status = str(record.get("status", "")).lower()
        if status in {"cancelled", "not_marked"}:
            continue
        if status not in {"present", "absent"}:
            unknown_statuses.add(status or "unknown")
            continue
        subject = str(record.get("subject") or record.get("subject_name") or "General")
        key = (str(record.get("subject_id") or subject), subject)
        grouped[key].append(status == "present")
        if record.get("id"):
            source_ids[key].append(str(record["id"]))
    rows = []
    for (subject_id, subject), values in grouped.items():
        present, total = sum(values), len(values)
        threshold = float((subject_thresholds or {}).get(subject, default_threshold))
        rows.append({"id": subject_id, "subject": subject, "presentClasses": present, "totalClasses": total, "percentage": attendance_percentage(present, total), "threshold": threshold, "safeBunks": safe_bunks(present, total, threshold), "requiredClasses": required_classes(present, total, threshold), "status": attendance_status(present, total, threshold), "afterAttending": attendance_percentage(present + 1, total + 1), "afterMissing": attendance_percentage(present, total + 1), "sourceIds": sorted(set(source_ids[(subject_id, subject)]))})
    total, present = sum(row["totalClasses"] for row in rows), sum(row["presentClasses"] for row in rows)
    warnings = [row for row in rows if row["status"] != "safe"]
    return {"overallPercentage": attendance_percentage(present, total) if total else None, "aggregationMethod": "count_weighted_student_snapshot", "totalClasses": total, "totalPresent": present, "subjectWarnings": warnings, "atRiskSubjects": [row["subject"] for row in rows if row["status"] == "danger"], "subjects": sorted(rows, key=lambda row: row["percentage"]), "dataQualityWarnings": ([f"Excluded records with unknown treatment: {', '.join(sorted(unknown_statuses))}"] if unknown_statuses else [])}
