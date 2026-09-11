import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotifications, type NotificationFactorySources } from '../src/features/notifications/notificationFactory.ts';
import { NotificationService, type NotificationSourceProvider } from '../src/features/notifications/service.ts';
import { defaultNotificationPreferences, type NotificationRepository } from '../src/features/notifications/repository.ts';
import type { NotificationPreferences, NotificationStateRecord } from '../src/features/notifications/models.ts';

const now = new Date('2026-09-10T10:00:00.000Z');
const preferences = { ...defaultNotificationPreferences(), updatedAt: now.toISOString() };
const allSources = (): NotificationFactorySources => ({
  assignments: [{ id: 'a1', title: 'Submit lab', deadline: '2026-09-11T10:00:00.000Z' }],
  examinations: [{ id: 'e1', title: 'Algorithms exam', startsAt: '2026-09-12T10:00:00.000Z' }],
  lectures: [{ id: 'l1', title: 'Algorithms', startsAt: '2026-09-10T10:20:00.000Z' }],
  attendance: [{ subjectId: 's1', subjectName: 'Algorithms', status: 'danger', percentage: 60, target: 75 }],
  studySessions: [{ id: 'ss1', title: 'Revise trees', endsAt: '2026-09-10T09:00:00.000Z', completed: false }],
  notices: [{ id: 'n1', title: 'Scholarship form', confirmedAt: '2026-09-09T10:00:00.000Z', applies: true }],
  atktUpdates: [{ id: 't1', title: 'ATKT form', status: 'Correction requested', updatedAt: '2026-09-10T08:00:00.000Z' }],
});

test('factory generates every required notification type with correct routes', () => {
  const values = createNotifications(allSources(), preferences, now);
  assert.deepEqual(new Set(values.map((item) => item.type)), new Set(['assignment_deadline', 'examination_reminder', 'lecture_reminder', 'attendance_alert', 'missed_study_session', 'new_notice', 'atkt_update']));
  assert.equal(values.filter((item) => ['assignment_deadline', 'examination_reminder', 'lecture_reminder'].includes(item.type)).every((item) => item.relatedPath === '/academics'), true);
  assert.equal(values.find((item) => item.type === 'attendance_alert')?.relatedPath, '/attendance');
  assert.equal(values.find((item) => item.type === 'missed_study_session')?.relatedPath, '/study-planner');
  assert.equal(values.find((item) => item.type === 'new_notice')?.relatedPath, '/notices');
  assert.equal(values.find((item) => item.type === 'atkt_update')?.relatedPath, '/notices');
});

test('factory removes duplicate stable source keys and handles empty input', () => {
  const source = allSources(); source.assignments.push({ ...source.assignments[0]! });
  assert.equal(createNotifications(source, preferences, now).filter((item) => item.type === 'assignment_deadline').length, 1);
  assert.deepEqual(createNotifications({ assignments: [], examinations: [], lectures: [], attendance: [], studySessions: [], notices: [], atktUpdates: [] }, preferences, now), []);
});

class MemoryNotificationRepository implements NotificationRepository {
  states: NotificationStateRecord[] = []; preferences: NotificationPreferences = preferences;
  async getStates() { return this.states; }
  async saveState(value: NotificationStateRecord) { this.states = [...this.states.filter((item) => item.stableSourceKey !== value.stableSourceKey), value]; return value; }
  async getPreferences() { return this.preferences; }
  async savePreferences(value: NotificationPreferences) { this.preferences = value; return value; }
  subscribe() { return () => undefined; }
}
class StaticSources implements NotificationSourceProvider { private readonly values: NotificationFactorySources; constructor(values: NotificationFactorySources) { this.values = values; } async load() { return this.values; } }

test('individual, bulk read and permanent dismissal states survive regeneration', async () => {
  const repository = new MemoryNotificationRepository(); const service = new NotificationService(repository, new StaticSources(allSources()));
  let inbox = await service.getInbox(now); await service.markRead(inbox[0]!.stableSourceKey, now); assert.equal((await service.getInbox(now)).find((item) => item.stableSourceKey === inbox[0]!.stableSourceKey)?.status, 'read');
  inbox = await service.getInbox(now); await service.markAllRead(inbox, now); assert.equal(service.unreadCount(await service.getInbox(now)), 0);
  await service.dismiss(inbox[0]!.stableSourceKey, now); assert.equal((await service.getInbox(now)).some((item) => item.stableSourceKey === inbox[0]!.stableSourceKey), false);
});

test('notification filters compose by type and read state', () => {
  const service = new NotificationService(new MemoryNotificationRepository(), new StaticSources(allSources())); const values = createNotifications(allSources(), preferences, now);
  values[0]!.status = 'read';
  assert.equal(service.filter(values, { status: 'read' }).length, 1);
  assert.equal(service.filter(values, { type: 'attendance_alert', status: 'unread' }).length, 1);
  assert.equal(service.filter(values, { type: 'lecture_reminder', status: 'read' }).length, 0);
});
