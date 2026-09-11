import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildStudentExport } from '../src/features/settings/exportService.ts';
import { DELETE_DATA_PHRASE, PrivacyService } from '../src/features/settings/privacyService.ts';
import { CAMPUSFLOW_OWNED_KEYS, LocalSettingsRepository, defaultSettings } from '../src/features/settings/repository.ts';
import { LocalNotificationRepository, defaultNotificationPreferences } from '../src/features/notifications/repository.ts';
import type { UploadedDocument } from '../src/features/settings/models.ts';

const installStorage = () => { const values = new Map<string, string>(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { get length() { return values.size; }, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } }); return values; };

test('theme, language and notification preferences save locally', async () => {
  installStorage(); const settings = new LocalSettingsRepository(); const notifications = new LocalNotificationRepository();
  await settings.saveSettings({ ...defaultSettings(), theme: 'dark', language: 'Marathi' });
  await notifications.savePreferences({ ...defaultNotificationPreferences(), attendanceAlerts: false, lectureReminderMinutes: 15 });
  assert.equal((await settings.getSettings()).theme, 'dark'); assert.equal((await settings.getSettings()).language, 'Marathi'); assert.equal((await notifications.getPreferences()).lectureReminderMinutes, 15);
});

test('versioned export contains expected sections and strips secret fields', () => {
  const payload = buildStudentExport({ profile: { id: 'me', password: 'never' }, studyPreferences: {}, subjects: [], assignments: [], attendance: [], examinations: [], timetable: [], studyPlans: [], reminders: [], notificationStates: [], confirmedNotices: [], atktApplications: [], aiHistory: { token: 'never', answer: 'safe' } }, { includeAiHistory: true }, '2026-09-11T00:00:00Z');
  assert.equal(payload.version, 1); assert.ok('profile' in payload && 'confirmedNotices' in payload && 'aiHistory' in payload); assert.doesNotMatch(JSON.stringify(payload), /never|password|token/);
  assert.equal('aiHistory' in buildStudentExport({ profile: {}, studyPreferences: {}, subjects: [], assignments: [], attendance: [], examinations: [], timetable: [], studyPlans: [], reminders: [], notificationStates: [], confirmedNotices: [], atktApplications: [], aiHistory: {} }, { includeAiHistory: false }), false);
});

test('AI history requires confirmation', async () => {
  const service = new PrivacyService(); let cleared = false; await assert.rejects(() => service.deleteAiHistory(false, () => { cleared = true; }), /confirmed/); assert.equal(cleared, false); await service.deleteAiHistory(true, () => { cleared = true; }); assert.equal(cleared, true);
});

test('document deletion calls its owning service after confirmation', async () => {
  const service = new PrivacyService(); const calls: string[] = []; const document: UploadedDocument = { id: 'note:n1', sourceId: 'n1', fileName: 'note.pdf', sourceModule: 'Notes', uploadedAt: '', updatedAt: '' };
  await assert.rejects(() => service.deleteDocument(document, false, { deleteNote: async () => undefined, deleteNoticeSource: async () => undefined }), /confirmed/);
  await service.deleteDocument(document, true, { deleteNote: async (id) => { calls.push(`note:${id}`); }, deleteNoticeSource: async (id) => { calls.push(`notice:${id}`); } }); assert.deepEqual(calls, ['note:n1']);
});

test('local deletion requires exact phrase and preserves non-CampusFlow storage', async () => {
  const service = new PrivacyService(); const values = new Map<string, string>([[CAMPUSFLOW_OWNED_KEYS[0], 'owned'], ['unrelated_app_key', 'keep']]); const target = { removeItem: (key: string) => { values.delete(key); } };
  await assert.rejects(() => service.deleteLocalDemoData('delete my data', target), /exactly/); assert.equal(values.has(CAMPUSFLOW_OWNED_KEYS[0]), true);
  await service.deleteLocalDemoData(DELETE_DATA_PHRASE, target); assert.equal(values.has(CAMPUSFLOW_OWNED_KEYS[0]), false); assert.equal(values.get('unrelated_app_key'), 'keep');
});

test('notifications, profile and settings routes are connected', () => {
  const app = readFileSync('src/App.tsx', 'utf8'); const navbar = readFileSync('src/components/Navbar.tsx', 'utf8');
  for (const route of ['/notifications', '/profile', '/settings']) { assert.match(app, new RegExp(`path="${route}"`)); assert.match(navbar, new RegExp(`path: '${route}'`)); }
});
