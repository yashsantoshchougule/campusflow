from typing import Dict, List
from app.core.supabase_client import supabase
from collections import defaultdict
from datetime import datetime, date, timedelta

async def get_dashboard_data(user_id: str):

    print("1. Overview")
    overview = await get_overview(user_id)

    print("2. Study")
    study = await get_study(user_id)

    print("3. Quiz")
    quiz = await get_quiz(user_id)

    print("4. Roadmap")
    roadmap = await get_roadmap(user_id)

    print("5. Activity")
    activity = await get_recent_activity(user_id)

    print("6. Weekly")
    weekly = await get_weekly_progress(user_id)

    print("Dashboard Complete")

    return {
        "overview": overview,
        "study": study,
        "quiz": quiz,
        "roadmap": roadmap,
        "activity": activity,
        "weekly_progress": weekly,
    }

# done
async def get_overview(user_id: str):
    try:

        print("\n========== OVERVIEW DEBUG ==========")
        print("Current User ID:", user_id)

        # -------------------- BOOKS --------------------

        books = (
            supabase.table("books")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .execute()
        )

        print("\nBOOKS")
        print("Count:", books.count)
        print("Rows:", len(books.data))
        print("Data:", books.data)

        # -------------------- NOTES --------------------

        notes = (
            supabase.table("notes")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .execute()
        )

        print("\nNOTES")
        print("Count:", notes.count)
        print("Rows:", len(notes.data))
        print("Data:", notes.data)

        # -------------------- QUIZZES --------------------

        quizzes = (
            supabase.table("quiz_history")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("created_at")
            .execute()
        )

        print("\nQUIZZES")
        print("Count:", quizzes.count)
        print("Rows:", len(quizzes.data))
        print("Data:", quizzes.data)

        # -------------------- ROADMAPS --------------------

        roadmaps = (
            supabase.table("roadmaps")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .execute()
        )

        print("\nROADMAPS")
        print("Count:", roadmaps.count)
        print("Rows:", len(roadmaps.data))
        print("Data:", roadmaps.data)

        # -------------------- SCORE CALCULATIONS --------------------

        average_score = 0
        best_score = 0
        latest_score = 0

        if quizzes.data:

            percentages = [
                round((q["score"] / q["total"]) * 100)
                for q in quizzes.data
            ]

            average_score = round(sum(percentages) / len(percentages))
            best_score = max(percentages)
            latest_score = percentages[-1]

        result = {

            "study_time": 0,

            "books": len(books.data),

            "notes": len(notes.data),

            "quiz_attempts": len(quizzes.data),

            "average_score": average_score,

            "best_score": best_score,

            "latest_score": latest_score,

            "current_streak": 0,

            "reading_progress": 0,

            "active_roadmaps": len(roadmaps.data),

        }

        print("\nFINAL OVERVIEW")
        print(result)
        print("=====================================\n")

        return result

    except Exception as e:

        print("\nOVERVIEW ERROR")
        print(e)

        return {

            "study_time": 0,
            "books": 0,
            "notes": 0,
            "quiz_attempts": 0,
            "average_score": 0,
            "best_score": 0,
            "latest_score": 0,
            "current_streak": 0,
            "reading_progress": 0,
            "active_roadmaps": 0,
        }
# done
async def get_study(user_id: str):

    books = (
        supabase.table("books")
        .select("*")
        .eq("user_id", user_id)
        .order("last_opened", desc=True)
        .execute()
    )

    if not books.data:
        return {
            "currently_reading": None,
            "recent_books": [],
            "reading_progress": 0,
        }

    currently_reading = books.data[0]

    recent_books = [
        {
            "id": book["id"],
            "title": book["title"],
            "current_page": book["current_page"],
            "total_pages": book["total_pages"],
            "last_opened": book["last_opened"],
        }
        for book in books.data[:5]
    ]

    total_pages = 0
    current_pages = 0

    for book in books.data:
        total_pages += book.get("total_pages", 0)
        current_pages += book.get("current_page", 0)

    progress = 0

    if total_pages > 0:
        progress = round((current_pages / total_pages) * 100)

    return {
        "currently_reading": {
            "title": currently_reading.get("title"),
            "current_page": currently_reading.get("current_page"),
            "total_pages": currently_reading.get("total_pages"),
            "cover": currently_reading.get("cover_image"),
        },
        "recent_books": recent_books,
        "reading_progress": progress,
    }

# done
async def get_quiz(user_id: str):
    
    history = (
    supabase.table("quiz_history")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", desc=True)
    .execute()
)
    if not history.data:
        return {
            "pass_rate": 0,
            "average_score": 0,
            "latest_score": 0,
            "best_score": 0,
            "total_attempts": 0,
            "weak_topics": [],
            "recent_attempts": [],
        }
    attempts = history.data

    total_attempts = len(attempts)

    scores = [
        round((q["score"] / q["total"]) * 100)
        for q in attempts
        ]

    average_score = round(sum(scores) / len(scores))
    latest_score = scores[0]
    best_score = max(scores)

    passed = len([s for s in scores if s >= 60])
    pass_rate = round(
        (passed / total_attempts) * 100
    )

    topic_counter = {}
    for attempt in attempts:
        for topic in attempt["weak_topics"]:
            topic_counter[topic] = (
                topic_counter.get(topic, 0) + 1
            )

    weak_topics = sorted(
    [
        {
            "topic": topic,
            "count": count,
        }
        for topic, count in topic_counter.items()
    ],
    key=lambda x: x["count"],
    reverse=True,
)

    recent_attempts = [
    {
        "date": attempt["created_at"],
        "score": attempt["score"],
        "total": attempt["total"],
        "percentage": round(
            (attempt["score"] / attempt["total"]) * 100
        ),
    }
    for attempt in attempts[:5]
]
    return {
    "pass_rate": pass_rate,
    "average_score": average_score,
    "latest_score": latest_score,
    "best_score": best_score,
    "total_attempts": total_attempts,
    "weak_topics": weak_topics,
    "recent_attempts": recent_attempts,
}


async def get_roadmap(user_id: str):
    
    roadmaps = (
    supabase.table("roadmaps")
    .select("*")
    .eq("user_id", user_id)
    .execute()
)
    if not roadmaps.data:
        return {
            "active": 0,
            "completed": 0,
            "behind": 0,
            "next_deadline": None,
            "nearest_subject": None,
        }
    
    active = 0
    completed = 0
    behind = 0
    nearest_date = None
    nearest_subject = None
    today = date.today()

    for roadmap in roadmaps.data:

        target = datetime.strptime(
        roadmap["target_date"],
        "%Y-%m-%d"
        ).date()

        if roadmap["status"] == "completed":
            completed += 1
        else:
            active += 1

        if target < today and roadmap["status"] != "completed":
            behind += 1

        if (
            roadmap["status"] != "completed"
            and (
                nearest_date is None
                or target < nearest_date
            )
        ):
            nearest_date = target
            nearest_subject = roadmap["subject"]

    return {
    "active": active,
    "completed": completed,
    "behind": behind,
    "next_deadline": (
        nearest_date.isoformat()
        if nearest_date
        else None
    ),
    "nearest_subject": nearest_subject,
}


async def get_recent_activity(user_id: str):

    activities = []

    books = (
        supabase.table("books")
        .select("title,last_opened")
        .eq("user_id", user_id)
        .order("last_opened", desc=True)
        .limit(5)
        .execute()
    )

    for book in books.data:

        if book["last_opened"]:

            activities.append({
                "type": "book",
                "title": f'Opened "{book["title"]}"',
                "time": book["last_opened"],
                "icon": "book",
            })


    notes = (
        supabase.table("notes")
        .select("title,last_edited")
        .eq("user_id", user_id)
        .order("last_edited", desc=True)
        .limit(5)
        .execute()
    )

    for note in notes.data:

        activities.append({
            "type": "note",
            "title": f'Edited "{note["title"]}"',
            "time": note["last_edited"],
            "icon": "file",
        })


    quizzes = (
        supabase.table("quiz_history")
        .select("subject,score,total,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    for quiz in quizzes.data:

        percentage = round(
            (quiz["score"] / quiz["total"]) * 100
        )

        activities.append({
            "type": "quiz",
            "title": f'{quiz["subject"].upper()} Quiz ({percentage}%)',
            "time": quiz["created_at"],
            "icon": "brain",
        })

        roadmaps = (
            supabase.table("roadmaps")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
            )

    for roadmap in roadmaps.data:

        activities.append({
            "type": "roadmap",
            "title": roadmap["subject"],
            "time": roadmap.get("created_at"),
        })

    activities.sort(
        key=lambda x: x["time"],
        reverse=True
    )

    return activities[:15]



async def get_weekly_progress(user_id: str):
    today = date.today()
    start_date = today - timedelta(days=6)
    week = defaultdict(lambda: {
        "quiz": 0,
        "notes": 0,
        "books": 0,
    })


    quizzes = (
        supabase.table("quiz_history")
        .select("created_at")
        .eq("user_id", user_id)
        .gte("created_at", start_date.isoformat())
        .execute()
    )

    for quiz in quizzes.data:

        day = datetime.fromisoformat(
            quiz["created_at"].replace("Z", "")
        ).strftime("%a")

        week[day]["quiz"] += 1

    notes = (
        supabase.table("notes")
        .select("last_edited")
        .eq("user_id", user_id)
        .gte("last_edited", start_date.isoformat())
        .execute()
    )

    for note in notes.data:

        day = datetime.fromisoformat(
            note["last_edited"].replace("Z", "")
        ).strftime("%a")

        week[day]["notes"] += 1

    books = (
        supabase.table("books")
        .select("last_opened")
        .eq("user_id", user_id)
        .gte("last_opened", start_date.isoformat())
        .execute()
    )

    for book in books.data:
        if not book["last_opened"]:
            continue
        day = datetime.fromisoformat(
            book["last_opened"].replace("Z", "")
        ).strftime("%a")
        week[day]["books"] += 1
    result = []

    for i in range(7):
        day = (start_date + timedelta(days=i))
        label = day.strftime("%a")
        result.append({
            "day": label,
            "quiz": week[label]["quiz"],
            "notes": week[label]["notes"],
            "books": week[label]["books"],
        })
    return result