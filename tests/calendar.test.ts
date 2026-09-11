import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aggregateCalendarEvents, type CalendarSources } from '../src/features/calendar/aggregationService.ts';
import { CalendarService, toLocalDateKey } from '../src/features/calendar/calendarService.ts';
import { ReminderService } from '../src/features/calendar/reminderService.ts';
import type { CalendarRepository } from '../src/features/calendar/repository.ts';
import type { CalendarPreferences, Reminder } from '../src/features/calendar/models.ts';
import type { Subject } from '../src/features/academics/models.ts';
import type { NoticeDraft } from '../src/features/notices/models.ts';

const calendar = new CalendarService();
const range = calendar.getWeekRange(new Date(2026, 8, 9));
const subject: Subject = { id: 'subject-1', name: 'Algorithms', code: 'CS301', facultyName: 'Dr Rao', credits: 4, difficulty: 'Hard', strengthLevel: 'Average', attendanceTarget: 75, colour: '#000', createdAt: '', updatedAt: '' };
const confirmedNotice = { id: 'notice-1', status: 'confirmed', version: 1, deadline: { value: '2026-09-12' }, title: { value: 'Scholarship form' }, category: { value: 'Scholarship' }, instructions: { value: ['Submit online'] } } as NoticeDraft;
const reminder: Reminder = { id: 'reminder-1', title: 'Bring calculator', reminderAt: '2026-09-11T09:00:00.000Z', subjectId: subject.id, status: 'active', createdAt: '', updatedAt: '' };
const sources = (): CalendarSources => ({
  subjects: [subject],
  assignments: [{ id: 'assignment-1', subjectId: subject.id, title: 'Lab report', description: 'Graphs', deadline: '2026-09-10', estimatedMinutes: 60, difficulty: 'Medium', priority: 'High', completedAt: null, createdAt: '', updatedAt: '' }],
  examinations: [{ id: 'exam-1', subjectId: subject.id, name: 'Midterm', examinationType: 'Written', examDate: '2026-09-11T10:00:00', topics: 'Trees', room: 'A1', preparationProgress: 20, studyPlanId: null, createdAt: '', updatedAt: '' }],
  timetableEntries: [{ id: 'lecture-1', subjectId: subject.id, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', facultyName: 'Dr Rao', classroom: 'B2', onlineLink: '', lectureType: 'Theory', createdAt: '', updatedAt: '' }],
  studySessions: [{ id: 'session-1', title: 'Revise graphs', start: '2026-09-09T18:00:00', subjectId: subject.id }],
  notices: [confirmedNotice, { ...confirmedNotice, id: 'draft-notice', status: 'draft' }],
  noticeLinks: [],
  atktDeadlines: [{ id: 'atkt-1', title: 'ATKT form closes', deadline: '2026-09-13', status: 'confirmed' }],
  reminders: [reminder],
});

test('monthly and weekly ranges use Monday through Sunday in local time', () => {
  const month = calendar.getMonthRange(new Date(2026, 8, 15));
  assert.equal(toLocalDateKey(month.start), '2026-08-31'); assert.equal(toLocalDateKey(month.end), '2026-10-04');
  assert.equal(toLocalDateKey(range.start), '2026-09-07'); assert.equal(toLocalDateKey(range.end), '2026-09-13');
});

test('all source types aggregate without mutating source records', () => {
  const input = sources(); const before = structuredClone(input); const events = aggregateCalendarEvents(input, range);
  assert.deepEqual(new Set(events.map((event) => event.sourceType)), new Set(['assignment', 'examination', 'lecture', 'study_session', 'notice', 'atkt_deadline', 'reminder']));
  assert.equal(events.find((event) => event.sourceType === 'assignment')?.allDay, true);
  assert.equal(events.find((event) => event.sourceType === 'examination')?.navigationPath, '/academics');
  assert.equal(events.find((event) => event.sourceType === 'lecture')?.sourceId, 'lecture-1');
  assert.equal(events.find((event) => event.sourceType === 'study_session')?.navigationPath, '/study-planner');
  assert.equal(events.find((event) => event.sourceType === 'notice')?.sourceId, 'notice-1');
  assert.equal(events.find((event) => event.sourceType === 'atkt_deadline')?.navigationPath, '/notices');
  assert.equal(events.find((event) => event.sourceType === 'reminder')?.isEditable, true);
  assert.equal(events.filter((event) => event.sourceType !== 'reminder').every((event) => !event.isEditable && !event.isDeletable), true);
  assert.deepEqual(input, before);
});

test('confirmed ATKT-linked notices become ATKT deadlines and drafts remain hidden', () => {
  const input = sources(); input.noticeLinks = [{ id: 'link-1', noticeId: 'notice-1', type: 'atkt_application', targetId: 'atkt-form', createdAt: '' }];
  const events = aggregateCalendarEvents(input, range);
  assert.equal(events.some((event) => event.sourceType === 'notice'), false);
  assert.equal(events.filter((event) => event.sourceType === 'atkt_deadline').length, 2);
  assert.equal(events.some((event) => event.sourceId === 'draft-notice'), false);
});

test('duplicate sources collapse to one event and empty source data stays empty', () => {
  const input = sources(); input.assignments.push(structuredClone(input.assignments[0]!));
  assert.equal(aggregateCalendarEvents(input, range).filter((event) => event.sourceType === 'assignment').length, 1);
  assert.deepEqual(aggregateCalendarEvents({ subjects: [], assignments: [], examinations: [], timetableEntries: [], studySessions: [], notices: [], noticeLinks: [], atktDeadlines: [], reminders: [] }, range), []);
});

test('subject and event-type filters compose and completed reminders can be excluded', () => {
  const events = aggregateCalendarEvents(sources(), range);
  assert.equal(calendar.applyFilters(events, { subjectId: subject.id, eventTypes: ['assignment'], includeCompletedReminders: false }).length, 1);
  assert.equal(calendar.applyFilters(events, { subjectId: 'missing', eventTypes: [], includeCompletedReminders: false }).length, 0);
  const completed = events.map((event) => event.sourceType === 'reminder' ? { ...event, metadata: { status: 'completed' } } : event);
  assert.equal(calendar.applyFilters(completed, { eventTypes: ['reminder'], includeCompletedReminders: false }).length, 0);
});

test('range selection handles all-day and same-day timed ordering', () => {
  const events = aggregateCalendarEvents(sources(), range);
  const day = { start: new Date(2026, 8, 11), end: new Date(2026, 8, 11, 23, 59, 59, 999) };
  const selected = calendar.getEventsForRange(events, day);
  assert.equal(selected.some((event) => event.sourceType === 'examination'), true);
  assert.deepEqual(calendar.getEventsForRange([], day), []);
});

class MemoryCalendarRepository implements CalendarRepository {
  reminders: Reminder[] = [];
  preferences: CalendarPreferences = { view: 'month', selectedDate: '', filters: { eventTypes: [], includeCompletedReminders: false } };
  async getReminders() { return structuredClone(this.reminders); }
  async saveReminder(value: Reminder) { const index = this.reminders.findIndex((item) => item.id === value.id); if (index < 0) this.reminders.push(value); else this.reminders[index] = value; return value; }
  async deleteReminder(id: string) { this.reminders = this.reminders.filter((item) => item.id !== id); }
  async getPreferences() { return this.preferences; }
  async savePreferences(value: CalendarPreferences) { this.preferences = value; return value; }
}

test('reminder create, update, complete, reopen, and delete preserve completion history', async () => {
  const repository = new MemoryCalendarRepository(); const service = new ReminderService(repository);
  const created = await service.createReminder({ title: ' Read ', reminderAt: '2026-09-10T10:00:00Z' }, new Date('2026-09-01T00:00:00Z'));
  assert.equal(created.title, 'Read');
  const updated = await service.updateReminder(created.id, { title: 'Read chapter', reminderAt: '2026-09-10T11:00:00Z' }); assert.equal(updated.title, 'Read chapter');
  const completed = await service.completeReminder(created.id, new Date('2026-09-02T00:00:00Z')); assert.ok(completed.completedAt);
  assert.deepEqual(await service.getOverdueReminders(new Date('2026-09-20T00:00:00Z')), []);
  const reopened = await service.reopenReminder(created.id); assert.equal(reopened.completedAt, undefined);
  assert.equal((await service.getOverdueReminders(new Date('2026-09-20T00:00:00Z')))[0]?.id, created.id);
  await service.deleteReminder(created.id); assert.deepEqual(await repository.getReminders(), []);
  await assert.rejects(() => service.createReminder({ title: ' ', reminderAt: 'bad' }), /title/);
});

test('overdue uses the supplied clock and upcoming events are chronological', async () => {
  const repository = new MemoryCalendarRepository(); repository.reminders = [
    { ...reminder, id: 'past', reminderAt: '2026-09-01T00:00:00Z' },
    { ...reminder, id: 'future-2', reminderAt: '2026-09-12T00:00:00Z' },
    { ...reminder, id: 'future-1', reminderAt: '2026-09-11T00:00:00Z' },
  ];
  const service = new ReminderService(repository); const now = new Date('2026-09-10T00:00:00Z');
  assert.deepEqual((await service.getOverdueReminders(now)).map((item) => item.id), ['past']);
  const upcomingEvents = aggregateCalendarEvents({ ...sources(), assignments: [], examinations: [], timetableEntries: [], studySessions: [], notices: [], atktDeadlines: [], reminders: await service.getUpcomingReminders(now) }, range);
  assert.deepEqual(calendar.getUpcomingEvents(upcomingEvents, now).map((event) => event.sourceId), ['future-1', 'future-2']);
});

test('/calendar route and navigation are connected', () => {
  assert.match(readFileSync('src/App.tsx', 'utf8'), /path="\/calendar"/);
  assert.match(readFileSync('src/components/Navbar.tsx', 'utf8'), /path: '\/calendar'/);
});

