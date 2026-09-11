# CampusFlow vertical-slice handoff

## Inspection and architecture

- Detected branch: `main` (the requested attachment expected `feature/ai-features`). The current branch already contains the CampusFlow work, so it was used without switching.
- The working tree was already heavily modified. No unrelated file was reset, reformatted, committed, or pushed.
- Frontend: `src/` (React, Vite, TypeScript). Backend: `backend/app/` with entry point `backend/main.py` (FastAPI). Persistence/Auth: the existing Supabase project.
- Reused: Supabase Auth and bearer-token interceptor, `require_user`, `DashboardService`, attendance formulas, priority/risk engines, academic repositories, todos, timetable, and the existing dashboard shell.
- Live ownership model inspected: `profiles.id = auth.users.id`; `student_subjects.user_id` maps the authenticated student to `subject_id`; `attendance_records.user_id` is the canonical attendance owner. Student RLS policies use `auth.uid() = user_id`. Existing staff policies remain separate and require `staff_subject_assignments`.
- The vertical slice is request-driven. It adds no cache, worker, second authentication system, or parallel source-of-truth table.

## Files

Created:

- `backend/app/services/intelligence_engine.py`
- `README-MERGE.md`

Modified:

- `backend/main.py`
- `backend/app/routes/dashboard.py`
- `backend/app/services/attendance_engine.py`
- `backend/app/services/dashboard_service.py`
- `backend/app/services/priority_engine.py`
- `backend/tests/test_dashboard_logic.py`
- `src/features/attendance/engine.ts`
- `src/features/attendance/models.ts`
- `src/features/attendance/repository.ts`
- `src/features/attendance/service.ts`
- `src/features/dashboard/summary.ts`
- `src/pages/AttendancePage.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Dashboard.css`
- `src/services/api.ts`
- `src/services/dashboardService.ts`
- `src/types/dashboard.ts`
- `tests/attendance.test.ts`
- `tests/dashboard.test.ts`

No dependency was added.

## Database and RLS

No migration was required. The live database already has RLS enabled and matching owner policies for `attendance_records`, including SELECT, INSERT, UPDATE, and DELETE with `auth.uid() = user_id`. The existing least-privilege staff policies were preserved. Backend attendance reads and mutations also include the verified token user ID explicitly, and enrolled subjects are resolved through the same user's active `student_subjects` rows.

Student-entered attendance is stored as `source_type = student` and `verification_status = pending`; it is not presented as institution-verified attendance.

## API contracts

All routes below require the existing Supabase bearer token and accept no student/user selector:

- `GET /api/dashboard/summary` — existing dashboard summary.
- `GET /api/dashboard/ai-summary` — dashboard plus shared deterministic intelligence.
- `GET /api/intelligence/state` — versioned Student State.
- `GET /api/intelligence/risks`
- `GET /api/intelligence/bottleneck`
- `GET /api/intelligence/capacity`
- `GET /api/intelligence/next-action` — action, auditable why data, and state version.
- `GET /api/attendance/summary`
- `GET /api/attendance/today`
- `POST /api/attendance/simulate` — `{ subjectId, attended, missed }`; simulation never mutates attendance.
- `POST /api/actions/complete` — `{ taskId, expectedStateVersion? }`; completes one owned checklist task and returns recalculated intelligence. A stale supplied version returns HTTP 409 and an inaccessible ID returns the same not-found response.

## Environment variable names

Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.

Backend: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `AI_PROVIDER`, `AI_MODEL_PRIMARY`, `AI_MODEL_FALLBACKS`, `AI_REQUEST_TIMEOUT_SECONDS`, `AI_MAX_RETRIES_PER_MODEL`, `GEMINI_API_KEY`.

## Local setup

1. Configure the frontend and backend environment files with the names above. Never place AI keys in a `VITE_*` variable.
2. Frontend: `npm install`, then `npm run dev`.
3. Backend: activate `backend/venv`, install `backend/requirements.txt`, then from `backend/` run `python -m uvicorn main:app --reload --port 8003`.
4. No new Supabase migration needs to be applied for this slice.

## Verification

- `backend/venv/Scripts/python.exe -m tests.test_dashboard_logic` — PASS (focused deterministic, ownership, two-user isolation, and closed-loop checks).
- `backend/venv/Scripts/python.exe -m tests.test_auth` — PASS.
- `backend/venv/Scripts/python.exe -m unittest tests.test_ai_fallback tests.test_notice_intelligence tests.test_study_ai` — PASS, 17 tests.
- Dashboard route registration check — PASS.
- `npm test` — PASS, 56/56 tests.
- `npm run build` — PASS (TypeScript and Vite); Vite reports existing dynamic-import and large-chunk warnings.
- ESLint on every changed frontend/test file — PASS.
- `npm run lint` — FAILS on 38 existing errors and 2 warnings outside this slice, principally legacy `no-explicit-any` findings and `PortalPage.tsx`'s effect warning. These were not broadened into the time-boxed patch.

The Supabase security advisor also reports two project-level items outside this slice: `privileged_action_audit` has RLS enabled with no policy, and leaked-password protection is disabled. Review [RLS linter 0008](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Manual demo

1. Sign in as a student and open `/dashboard`.
2. Show the shared `state_version` and freshness beside Today Command Center.
3. Show Next Best Action, expand “Why am I seeing this?”, and point to facts, inference, confidence, and source IDs.
4. Show Attendance Today with current, attend, and miss percentages plus the responsible decision status.
5. Show capacity required/available minutes and any timetable collision.
6. Confirm the recommended completion action. The dashboard reloads from Supabase and displays the recalculated state version and recommendation.
7. Open `/attendance` to inspect subject calculations and the count-weighted snapshot label.

## Challenge coverage

| Pillar | Implemented UI/API | Evidence | Test/demo |
|---|---|---|---|
| Notes and assignments | Existing Notes/Academics remain; assignments feed risk and Next Best Action | Authorized Supabase assignment rows | Dashboard priority and completion loop |
| Attendance and schedule | Attendance Today, projections, capacity/collision, summary/simulation APIs | Owned attendance, active enrolment, timetable | Exact formulas, status boundaries, two-user isolation |
| Doubt solving | Existing evidence-locked Study AI remains available | Existing authorized document retrieval | Preserved regression suite; no new doubt flow in this time-box |

## 3–5 minute judge script

“CampusFlow is an Academic Decision Twin, not another collection of CRUD screens. This authenticated dashboard assembles one student-owned state, shows its version and freshness, and ranks the safest next action. Here is Why: verified facts, deterministic inference, confidence, and source IDs. Attendance Today uses exact counts—not rounded percentages—to show the consequence of attending or missing, and it never tells the student to skip. The schedule card exposes required versus available time and collisions. I will now confirm one action. CampusFlow writes only the authenticated student's row through RLS, reloads the state, and the version and recommendation change. If Gemini is unavailable, this decision loop still works because arithmetic, risk, capacity, and ranking are deterministic; Study AI reports provider unavailability rather than inventing facts.”

## Explicitly incomplete after the time-boxed slice

- The new Assignment–Notes Coverage Map and its gap-action flow were not implemented.
- The new structured Doubt → Evidence → Teach-back → Action flow was not implemented; the existing evidence-locked Study AI was preserved.
- Dependency persistence/confirmation, Morning Brief, Explain My Day, full Academic Timeline, rescheduling, dismissals, recovery-date forecasting, and multi-lecture backend simulation remain P1 work.
- A live two-auth-session RLS integration run was not performed because a second authenticated test session was not provisioned. Live policies were inspected, and the backend two-user isolation/defense-in-depth path is covered with deterministic fakes.

## Suggested commit commands (not executed)

```powershell
git add README-MERGE.md backend/main.py backend/app/routes/dashboard.py backend/app/services/attendance_engine.py backend/app/services/dashboard_service.py backend/app/services/intelligence_engine.py backend/app/services/priority_engine.py backend/tests/test_dashboard_logic.py src/features/attendance src/features/dashboard/summary.ts src/pages/AttendancePage.tsx src/pages/Dashboard.tsx src/pages/Dashboard.css src/services/api.ts src/services/dashboardService.ts src/types/dashboard.ts tests/attendance.test.ts tests/dashboard.test.ts
git commit -m "feat: add secure CampusFlow decision twin vertical slice"
```
