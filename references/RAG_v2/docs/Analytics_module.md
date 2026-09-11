# System Architecture Documentation

**Module:** Analytics (v1.0.0)

**Document Status:** Production-Ready

**Last Updated:** July 2026

---

## 1. Executive Summary & Purpose

The **Analytics Module** serves as the centralized data aggregation and reporting layer for the platform. By ingesting event streams and structural data from books, notes, quizzes, and learning roadmaps, this module synthesizes raw operational data into actionable, high-level metrics and visual reports.

The primary business and user experience objective is to increase student engagement and retention through transparent progress tracking, performance benchmarking, and behavioral insights.

---

## 2. Technical Stack

The core architecture leverages a decoupled frontend/backend framework designed for fast aggregation and minimal database overhead.

* **Backend Framework:** FastAPI (Python 3.11+)
* **Database & ORM:** Supabase Ecosystem / PostgREST
* **Authentication & Security:** Supabase JWT (Bearer Token Verification via JSON Web Tokens)
* **Frontend UI Engine:** React.js, Tailwind CSS (Fully Responsive Layout Engine)
* **Data Visualization:** Recharts (SVG-based reactive chart components)
* **HTTP Client:** Axios

---

## 3. Data Architecture & Schema Dependencies

The Analytics Module operates read-only actions against four core Supabase tables. Data is compiled using a pull-model when the dashboard endpoint is invoked.

```
┌────────────────────────────────────────────────────────┐
│                    SUPABASE LAYER                      │
│                                                        │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐  │
│  │     books     │ │     notes     │ │ quiz_history │  │
│  └───────┬───────┘ └───────┬───────┘ └──────┬───────┘  │
│          │                 │                │          │
│          └─────────────────┼────────────────┘          │
│                            ▼                           │
└────────────────────────────────────────────────────────┘

```

| Source Table | Monitored Attributes / Fields | Derived Analytics Metrics |
| --- | --- | --- |
| **`books`** | `id`, `user_id`, `last_opened_at`, `progress_percent`, `status` | Total uploaded books, currently reading, recently opened books, completion rates. |
| **`notes`** | `id`, `user_id`, `updated_at`, `title` | Total notes created, recent modifications for timeline injection. |
| **`quiz_history`** | `id`, `user_id`, `score`, `total_questions`, `topic_tags`, `created_at` | Total attempts, average score, maximum score, latest score, failure rate, weak topic mapping. |
| **`roadmaps`** | `id`, `user_id`, `status`, `target_date`, `subject_name`, `progress` | Active/completed roadmaps, schedule variance, milestone deadlines. |

---

## 4. Backend Architecture

### 4.1 Directory Structure

The backend maintains a clean modular separation of routing layers and business logic engines:

```
analytics/
│
├── __init__.py
├── router.py       # HTTP Endpoint Definitions & Dependency Injection
└── service.py      # Business Logic, Aggregation Engines & DB Queries

```

### 4.2 API Endpoint Specifications

#### `GET /analytics/dashboard`

* **Description:** Retrieves a unified, compiled JSON payload encompassing all sub-domain statistics for the authenticated user.
* **Access Control:** Protected. Requires valid `Authorization: Bearer <JWT_TOKEN>` header.
* **Query Parameters:** None.
* **Success Response Code:** `200 OK`

##### Response Payload Schema (`application/json`)

```json
{
  "overview": {
    "total_uploaded_books": 14,
    "total_notes": 42,
    "quiz_attempts": 28,
    "average_quiz_score": 78.5,
    "best_quiz_score": 100.0,
    "latest_quiz_score": 85.0,
    "active_roadmaps": 3,
    "reading_progress_percent": 64.2,
    "study_streak_days": 0,
    "study_time_hours": 0
  },
  "study": {
    "current_book": {
      "id": "b8f9a2c1",
      "title": "Introduction to Algorithms"
    },
    "recently_opened": [
      { "id": "b8f9a2c1", "title": "Introduction to Algorithms", "last_opened": "2026-07-18T14:32:00Z" }
    ],
    "completion_percentage": 45.8
  },
  "quiz": {
    "pass_rate": 82.1,
    "average_score": 78.5,
    "best_score": 100.0,
    "latest_score": 85.0,
    "total_attempts": 28,
    "frequently_weak_topics": ["Dynamic Programming", "SQL Joins"],
    "recent_attempts": [
      { "quiz_id": "q101", "score": 85.0, "timestamp": "2026-07-19T10:15:00Z" }
    ]
  },
  "roadmap": {
    "active_roadmaps_count": 3,
    "completed_roadmaps_count": 5,
    "behind_schedule_count": 1,
    "nearest_deadline": "2026-08-01T00:00:00Z",
    "current_subject": "Data Systems",
    "statistics": {}
  },
  "activity": [
    {
      "module": "book",
      "action": "opened",
      "timestamp": "2026-07-19T16:00:00Z",
      "meta": { "title": "Designing Data-Intensive Applications" }
    }
  ],
  "weekly_progress": [
    { "day": "Monday", "books_opened": 2, "notes_edited": 4, "quiz_attempts": 1 },
    { "day": "Tuesday", "books_opened": 1, "notes_edited": 0, "quiz_attempts": 2 },
    { "day": "Wednesday", "books_opened": 3, "notes_edited": 5, "quiz_attempts": 0 },
    { "day": "Thursday", "books_opened": 0, "notes_edited": 1, "quiz_attempts": 1 },
    { "day": "Friday", "books_opened": 4, "notes_edited": 6, "quiz_attempts": 3 },
    { "day": "Saturday", "books_opened": 1, "notes_edited": 2, "quiz_attempts": 0 },
    { "day": "Sunday", "books_opened": 2, "notes_edited": 1, "quiz_attempts": 1 }
  ]
}

```

### 4.3 Service Logic Orchestration

The primary function `get_dashboard_data(user_id: str)` acts as the internal controller, handling concurrent calls or sequential fetches across internal private sub-routines.

```python
# System pseudo-execution path within service.py
def get_dashboard_data(user_id: str) -> dict:
    return {
        "overview": get_overview(user_id),
        "study": get_study(user_id),
        "quiz": get_quiz(user_id),
        "roadmap": get_roadmap(user_id),
        "activity": get_recent_activity(user_id),
        "weekly_progress": get_weekly_progress(user_id)
    }

```

---

## 5. Frontend Architecture & Interface Layout

The frontend leverages a modular tabbed/view architecture rooted in the parent `<AnalyticsDashboard/>` component.

```
AnalyticsDashboard/ (Parent Container Route)
│
├── Overview/       # Top-level KPI highlights & general layout
├── Study/          # Library engagement metrics & reading velocity
├── Quiz/           # Historical test evaluation
├── Performance/    # Focus trends & aggregated grading metrics
├── Roadmaps/       # Target milestones & track progress tracking
└── Reports/        # Extensible raw data layouts & platform outputs

```

### View Specifications

* **Overview View:** Renders Key Performance Indicator (KPI) grid cards alongside a Recharts composite line/bar graph representing weekly activity, followed by recent activity lists and a placeholder component for generative AI observations.
* **Study View:** Surface-level insights regarding document engagement, highlighting the most active reading resources, total minutes or percentages completed, and an intuitive "Recently Accessed" item reel.
* **Quiz View:** Focused dashboard capturing pass rates alongside specific subject tags flagged as "weak topics" via string aggregation.
* **Performance View:** Deep-dive historical evaluation layer mapping out score variances over multi-week bounds.
* **Roadmaps View:** Tracks completion statuses across current roadmap plans, parsing and rendering temporal deadlines.
* **Reports View:** Tabular summary structures serving as the staging ground for raw analytics readouts.

---

## 6. System Execution Lifecycle

```
[ Supabase Storage & Database Tables ]
                 │ (Raw Row-Level Reads)
                 ▼
     [ service.py Data Layer ]  ──► (Transforms & Agregates Map Arrays)
                 │ 
                 ▼
     [ router.py API Layer ]    ──► (Exposes GET /analytics/dashboard)
                 │
                 ▼
      [ React Web Application ] ──► (Axios Interceptor Ingests JWT Authenticated Data)
                 │
                 ▼
  [ UI Views via Recharts Engine ] ──► (Renders Overview, Quiz, Roadmaps Widgets)

```

---

## 7. Operational Status & Release Planning

### v1.0.0 Completed Deliverables

* [x] Core Python/FastAPI Router and Service pipeline architecture.
* [x] Targeted aggregations against Supabase `books`, `notes`, `quiz_history`, and `roadmaps`.
* [x] Secure API routing context guarded by Supabase JWT checks.
* [x] Fully dynamic React UI client rendering SVG charting instances using Recharts.

### v2.0.0 Future Development Roadmap

* [ ] **Server-Side Document Exporters:** Implementation of raw binary report downloads via standalone `.pdf`, `.csv`, and `.json` data endpoints.
* [ ] **LLM Recommendation Integration:** Deployment of an automated backend agent hook connecting verified weak study items to specialized AI learning recommendations.
* [ ] **Temporal Data Expansion:** Transition tracking from simple weekly snapshots to extended 30-day/monthly historical logs.
* [ ] **Gamification Engines:** Engine support for streaks, active daily tracking counters, and credential/badge triggers based on system actions.