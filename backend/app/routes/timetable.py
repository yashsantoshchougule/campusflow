import csv
import io

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/api/timetable", tags=["timetable"])
REQUIRED_COLUMNS = {"day", "start_time", "end_time", "subject", "type"}
VALID_DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}


@router.post("/import")
async def import_timetable(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be CSV")

    contents = await file.read()
    if not contents or len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Files must be between 1 byte and 10 MB")

    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
        rows = list(reader)
    except (csv.Error, UnicodeDecodeError) as error:
        raise HTTPException(status_code=400, detail="Invalid or empty CSV") from error

    if not REQUIRED_COLUMNS.issubset(reader.fieldnames or []):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(sorted(REQUIRED_COLUMNS))}")

    entries = []
    for row in rows:
        entry = {key: str(row.get(key, "")).strip() for key in (*REQUIRED_COLUMNS, "location")}
        if entry["day"] not in VALID_DAYS or not all(entry[key] for key in REQUIRED_COLUMNS):
            raise HTTPException(status_code=400, detail="CSV contains an invalid timetable row")
        entries.append(entry)

    if not entries:
        raise HTTPException(status_code=400, detail="CSV contains no timetable rows")
    return {"entries": entries}
