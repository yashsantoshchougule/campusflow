# Third-Party Notices

## 75 Club

Portions of the attendance calculation engine and its tests were adapted from
[75 Club](https://github.com/Kesavaraja67/75-club), commit
`0b53ecd3c6cddadd786bf09a4379595e05bd41a2`.

Copyright © Kesavaraja. Licensed under the MIT License as declared by the
project's README.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## RAG_v2

The heading-aware ingestion and evidence-only question-answering flow in
`src/features/studyAi/engine.ts` and the provider boundary in
`backend/app/services/study_ai_provider.py` were adapted from:

- `backend/app/modules/Ingestion/ingestion.py`
- `backend/app/modules/Qa/query.py`
- `backend/app/modules/Quiz/quiz.py`
- `backend/app/modules/Notes/notes.py`
- `frontend/src/api.js`

Source: https://github.com/prateEKsaha07/RAG_v2 at commit
`e7b22ffb200c8395a88c6f93ee9ae935b53f4473`.

Copyright 2026 Prateek Saha. Licensed under the Apache License, Version 2.0.
The complete unmodified licence is preserved at `references/RAG_v2/LICENSE`.
CampusFlow rewrites the selected flow in TypeScript/Python, removes FAISS,
Cohere, Supabase and authentication code, and adds local scope and citation
validation.

## Quiz-Generator

The citation verification pipeline and quiz-player workflow were adapted from:

- `server/src/ai/agents/knowledgeExtractor.js`
- `server/src/ai/agents/quizPlanner.js`
- `server/src/ai/agents/questionGenerator.js`
- `server/src/ai/agents/verifier.js`
- `server/src/services/quizGenerator.js`
- `client/src/components/QuestionCard.jsx`
- `client/src/components/Citation.jsx`
- `client/src/pages/Quiz.jsx`
- `client/src/pages/Result.jsx`
- `client/src/pages/Review.jsx`

Source: https://github.com/HyDrSnic/Quiz-Generator at commit
`dbf7fd2a3d85741ba79c782d13ae9290cf86c3d1`. The repository README and both
package manifests declare the project MIT licensed; the repository contains no
separate LICENSE file or copyright notice. Its original source and declarations
are preserved under `references/Quiz-Generator/`.

## dagimgetaw/OCR

Source: https://github.com/dagimgetaw/OCR at commit
`ca202019340efd0f4143faa761dee35af5987755`.

Adapted files/functions: `image_processing.py` image OCR flow,
`pdf_processing.py` PDF text-layer/OCR flow, and `main.py` upload dispatch.

The upstream README declares the project MIT licensed and refers to a LICENSE
file, but no LICENSE file or copyright notice is present in the cloned commit.
This notice preserves the upstream declaration without inventing attribution.

## RPA-Driven-Academic-Mail-Manager

Source: https://github.com/Nidhish-Balasubramanya/RPA-Driven-Academic-Mail-Manager
at commit `743cb2abdbc59dbbda0cadc42fc95fe5b090e40d`.

Adapted files/functions: `app/models.py` academic-context fields and
`app/main.py` ISO-date validation/calendar action boundary.

MIT License

Copyright (c) 2025 Nidhish

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## react-webcam

Source: https://github.com/mozmorris/react-webcam at commit
`7522284fd66f98ff2d846e73881f65d35e840dab`. CampusFlow uses the published
`react-webcam` 7.1.1 component from `src/react-webcam.tsx`.

MIT License

Copyright (c) 2018 Moz Morris

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## MK QuizFlow

PDF extraction, deterministic quiz generation, scoring, IndexedDB persistence,
and one-question-at-a-time player behaviour were adapted from:

- `src/lib/pdf.ts`
- `src/lib/generator.ts`
- `src/lib/scoring.ts`
- `src/lib/storage.ts`
- `src/lib/types.ts`
- `src/components/player/QuizPlayer.tsx`
- `src/components/player/QuizResults.tsx`

Source: https://github.com/mk-knight23/MK-QuizFlow at commit
`b56763bb33fad1dfffb94bbf2e38dee5a8573fdc`.

Copyright (c) 2026 Kazi Musharraf.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## full-calendar

Calendar models, date ranges, navigation, filtering, month/week structure, and
event selection were adapted from:

- `src/features/calendar/types.ts`
- `src/features/calendar/interfaces.ts`
- `src/features/calendar/helpers.ts`
- `src/features/calendar/hooks.ts`
- `src/features/calendar/contexts/calendar-context.tsx`
- `src/features/calendar/calendar-body.tsx`
- `src/features/calendar/header/calendar-header.tsx`
- `src/features/calendar/header/date-navigator.tsx`
- `src/features/calendar/header/today-button.tsx`
- `src/features/calendar/header/view-tabs.tsx`
- `src/features/calendar/views/month-view/calendar-month-view.tsx`
- `src/features/calendar/views/month-view/day-cell.tsx`
- `src/features/calendar/views/month-view/month-event-badge.tsx`
- `src/features/calendar/views/week-and-day-view/calendar-week-view.tsx`
- `src/features/calendar/views/week-and-day-view/calendar-day-view.tsx`
- `src/features/calendar/views/week-and-day-view/event-block.tsx`

Source: https://github.com/yassir-jeraidi/full-calendar at commit
`bd8eba932e4ec359353ec1f0cd9ec8daa9de16b1`.

MIT License. Copyright (c) 2025 Jeraidi Yassir. The complete unmodified license
is preserved at `references/full-calendar/LICENSE`.

## Calendar-App

Reminder CRUD, local persistence, date validation, time handling, overdue
comparison, and date-range occurrence logic were adapted from:

- `calender-app/src/Components/CALENDERAPP.jsx`
- `calender-app/src/utils/recurrence.js`

Source: https://github.com/TacticalReader/Calendar-App at commit
`38c5e2762e31b28c6124c93ef517b421ce88dbe8`.

Licensed under the Apache License, Version 2.0. The complete unmodified license
is preserved at `references/calendar-app/LICENSE`.

## Vale

The replaceable local repository pattern, source aggregation, subject filtering,
and event-detail selection were adapted from:

- `src/services/api.ts`
- `src/hooks/useLocalStorage.ts`
- `src/hooks/useCourses.ts`
- `src/components/Calendar.tsx`
- `src/components/CourseFilters.tsx`

Source: https://github.com/diegnghtmr/vale at commit
`f90ef546f748c3341873938e89d08ecb5183ceca`.

MIT License. Copyright (c) 2025 Diego Alejandro Flores Quintero. The complete
unmodified license is preserved at `references/vale/LICENSE`.

## zenith-notification-center

Notification models, immutable inbox actions, filtering, unread counts,
persistence, inbox controls and empty-state behavior were adapted from:

- `src/types/notification.ts`
- `src/utils/filtering.ts`
- `src/hooks/useUnreadCount.ts`
- `src/services/NotificationService.ts`
- `src/services/StorageService.ts`
- `src/components/Inbox/NotificationInbox.tsx`
- `src/components/Filters/NotificationFilters.tsx`
- `tests/filtering.test.ts`

Source: https://github.com/arunkumarbrahmaniyaa/zenith-notification-center at
commit `46959755b17c3f0da5e43102a24cf5d0713c676a`.

MIT License. Copyright (c) 2026 arunkumarbrahmaniyaa. The complete unmodified
license is preserved at `references/zenith-notification-center/LICENSE`.

## ResuMate

Profile validation/save behavior and typed destructive confirmation were
adapted from `frontend/src/pages/Settings.jsx`.

Source: https://github.com/Soumitra-Sahoo/ResuMate at commit
`0fe8ee5402795883a27cca3b7d2f51b6c6dcf69b`.

The upstream README declares the project MIT licensed and identifies Soumitra
Sahoo as the author, but the cloned commit contains no standalone LICENSE file.
This notice preserves the upstream declaration without inventing license text.

## rehooks/local-storage

Storage availability detection, memory fallback, and same-window/cross-tab
storage update events were adapted from:

- `src/is-browser.ts`
- `src/storage.ts`
- `src/local-storage-events.ts`

Source: https://github.com/rehooks/local-storage at commit
`3a7784e5537b63dbc2a864f237123d6fcc22ac7f`.

MIT License. Copyright (c) 2018-present LocalStorage. The complete unmodified
license is preserved at `references/react-local-storage/LICENSE`.
