# 🗺️ Roadmap Module Documentation (v1)

## Purpose

Generates and manages a personalized study roadmap for each subject. The roadmap helps the user:

* Study according to a target date
* Track completed topics
* Identify weak topics
* Monitor progress
* Extend the schedule if needed

---

## Backend

### API Router: `/roadmap`

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/roadmap` | Creates a new roadmap |
| **GET** | `/roadmap/{subject}` | Returns roadmap metadata, weekly plans, progress, and topic metrics |
| **PUT** | `/roadmap/{subject}/complete-topic` | Marks a topic as completed and updates status/completion date |
| **PUT** | `/roadmap/{subject}/extend` | Extends the target date and recalculates the roadmap schedule |

#### Endpoint Specifications

* **POST `/roadmap` (Generate Roadmap) Input:**
* `subject`
* `target date`
* `hours/day`
* `scope`


* **PUT `/roadmap/{subject}/complete-topic` Request Body:**
```json
{
  "week": 2,
  "topic_name": "Normalization"
}

```


* **PUT `/roadmap/{subject}/extend` Request Body:**
```json
{
  "new_target_date": "2026-08-20"
}

```



---

## Frontend

### RoadmapScreen (`RoadmapScreen.jsx`)

* **Responsibilities:**
* Fetch roadmap data
* Render roadmap visual interface
* Mark topics complete
* Extend roadmap timeline
* Calculate and display statistics


* **Data Layer:** Uses `roadmapApi.js` and `roadmapStats.js` *(No direct fetch/axios calls)*

---

## Modular Architecture

### API Layer (`src/api/roadmapApi.js`)

*Single source for backend communication.*

* `getRoadmap()`
* `completeTopic()`
* `extendRoadmap()`

### Utilities (`src/utils/roadmapStats.js`)

*Business logic extracted to keep the UI view lean (~70 lines removed from screen).*

* `getRoadmapStats(roadmap)` returns: `progress`, `completed`, `total`, `daysLeft`, `pace`

### Current Folder Structure

```text
roadmap/
├── api/
│   └── roadmapApi.js
├── utils/
│   └── roadmapStats.js
├── screens/
│   └── RoadmapScreen.jsx
└── backend/
    ├── router.py
    ├── service.py
    └── schemas.py

```

### Technical Data Flow

`User` ➔ `RoadmapScreen` ➔ `roadmapApi.js` ➔ `FastAPI` ➔ `Roadmap Service` ➔ `Supabase`

---

## Feature Roadmap

### Current Features

* [x] Personalized roadmap generation
* [x] Weekly breakdown view
* [x] Topic completion toggling
* [x] Overall progress bar
* [x] Study pace calculation
* [x] Weak topic highlighting
* [x] Extend target date flexibility
* [x] Summary metrics cards

### Planned Features & Improvements

#### High Priority Improvements

* [ ] Add a refresh button for manual data sync
* [ ] Implement a better loading skeleton state
* [ ] Design a clean, informative error state
* [ ] Replace native alerts with Toast notifications
* [ ] Add an "Empty roadmap" illustration/empty-state UI

#### Medium Priority UI Features

* [ ] Expandable/collapsible weekly modules
* [ ] Search bar to find specific topics
* [ ] Filter to toggle visibility of completed topics
* [ ] Export roadmap as PDF
* [ ] Print-optimized roadmap stylesheets

#### Dashboard Integration (Planned Widgets)

* [ ] Current Week
* [ ] Today's Topics
* [ ] Overall Progress
* [ ] Days Remaining
* [ ] Weak Topics Callout
* [ ] Current Study Streak
* [ ] "Continue Roadmap" quick-action button

#### Future Smart Features (AI Integration)

* [ ] AI automatically adjusts the roadmap layout after each quiz
* [ ] Dynamic reordering of remaining topics based on identified weak areas
* [ ] Intelligent automated suggestions for "Today's Study"
* [ ] Predictive delivery forecasting (estimates if the user will finish by the target date)
* [ ] Automatic generation of catch-up plans if the user falls behind schedule
* [ ] Adaptive machine learning to study pacing that dynamically adjusts daily workloads
* [ ] Smart push notifications and reminders based on real-time progress metrics

---

## Status

* **Overall Completion:** ~85%
* **Current State:** Stable and fully usable.
* **Summary:** Remaining work is focused primarily on quality-of-life UI polish and advanced AI enhancements rather than core architecture or functionality.