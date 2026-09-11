/** Tests adapted from 75 Club lib/__tests__/attendance.test.ts (MIT). */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attendanceAfterAttending, attendanceAfterMissing, forecastAttendance, getAggregateStats,
  getAttendanceDecision, getAttendancePercentage, getAttendanceRecommendation, getAttendanceStatus, getRecoveryClasses,
  getSafeBunks, simulateDateRange, summarizeAttendance,
} from '../src/features/attendance/engine.ts';
import { localStorageAttendanceRepository } from '../src/features/attendance/repository.ts';
import type { AttendanceRecord, AttendanceSubjectContext } from '../src/features/attendance/models.ts';

const context: AttendanceSubjectContext[] = [{ subjectId: 'math', name: 'Mathematics', code: 'MA101', colour: '#123456', threshold: 75 }];
const record = (status: AttendanceRecord['status'], id: string, timetableEntryId: string | null = null, date = '2026-01-05'): AttendanceRecord => ({ id, studentId: 'student', subjectId: 'math', timetableEntryId, date, status, createdAt: date, updatedAt: date });

test('percentage, attend and miss formulas are correct', () => {
  assert.equal(getAttendancePercentage(30, 40), 75);
  assert.equal(getAttendancePercentage(0, 0), 0);
  assert.equal(attendanceAfterAttending(3, 4), 80);
  assert.equal(attendanceAfterMissing(3, 4), 60);
});

test('safe bunks and recovery calculations match the target formula', () => {
  assert.equal(getSafeBunks(32, 40, 75), 2);
  assert.equal(getSafeBunks(30, 40, 75), 0);
  assert.equal(getRecoveryClasses(20, 40, 75), 40);
  assert.equal(getRecoveryClasses(10, 10, 100), 0);
  assert.equal(getRecoveryClasses(9, 10, 100), null);
});

test('today decision uses exact counts and responsible statuses', () => {
  assert.equal(getAttendanceDecision(0, 0, 75).status, 'INSUFFICIENT_DATA');
  assert.equal(getAttendanceDecision(2, 4, 75).status, 'MUST_ATTEND');
  assert.equal(getAttendanceDecision(3, 4, 75).status, 'ATTEND_RECOMMENDED');
  const buffered = getAttendanceDecision(9, 10, 75);
  assert.equal(buffered.status, 'ABOVE_BUFFER');
  assert.match(buffered.reason, /attending may still be academically beneficial/i);
  assert.equal(getAttendanceDecision(3, 4, 75, 5, false).status, 'NOT_COUNTABLE_OR_CANCELLED');
  assert.equal(getAttendanceDecision(750_001, 1_000_000, 75).status, 'ATTEND_RECOMMENDED');
  assert.equal(getAttendanceDecision(749_999, 999_999, 75).status, 'MUST_ATTEND');
});

test('cancelled lectures are excluded and overall attendance is weighted', () => {
  const math = summarizeAttendance(context, [record('present', '1'), record('absent', '2'), record('cancelled', '3')])[0]!;
  const physics = { ...math, subjectId: 'physics', name: 'Physics', totalClasses: 8, presentClasses: 8, status: 'safe' as const };
  assert.equal(math.totalClasses, 2);
  assert.equal(math.cancelledClasses, 1);
  assert.equal(math.percentage, 50);
  assert.equal(getAggregateStats([math, physics]).overallPercentage, 90);
});

test('status, what-if and recovery recommendations are deterministic', () => {
  assert.equal(getAttendanceStatus(35, 40, 75), 'safe');
  assert.equal(getAttendanceStatus(30, 40, 75), 'warning');
  assert.equal(getAttendanceStatus(20, 40, 75), 'danger');
  assert.equal(forecastAttendance(30, 40, 2, 1, 75).percentage, 32 / 43 * 100);
  const summary = summarizeAttendance(context, [record('absent', '1')])[0]!;
  assert.match(getAttendanceRecommendation(summary), /Attend the next/);
});

test('date-range simulation counts timetable rows and skips recorded lectures', () => {
  const summary = summarizeAttendance(context, [record('present', '1', 'slot-1')]);
  const timetable = [{ id: 'slot-1', subjectId: 'math', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00' }];
  const projection = simulateDateRange(summary, timetable, [record('present', '1', 'slot-1')], '2026-01-05', '2026-01-12', 'absent')[0]!;
  assert.equal(projection.scheduledClasses, 1);
  assert.equal(projection.totalClasses, 2);
  assert.equal(projection.percentage, 50);
});

test('local repository persists asynchronous create, edit and delete operations', async () => {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  const created = await localStorageAttendanceRepository.createRecord({ studentId: 'student', subjectId: 'math', timetableEntryId: null, date: '2026-01-05', status: 'present' });
  assert.equal((await localStorageAttendanceRepository.getRecords('student')).length, 1);
  await localStorageAttendanceRepository.updateRecord(created.id, { status: 'absent' });
  assert.equal((await localStorageAttendanceRepository.getRecords('student'))[0]?.status, 'absent');
  await localStorageAttendanceRepository.deleteRecord(created.id);
  assert.equal((await localStorageAttendanceRepository.getRecords('student')).length, 0);
});
