import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardSummary } from '../src/features/dashboard/summary.ts';
import type { DashboardSourceData } from '../src/features/dashboard/summary.ts';

test('dashboard is built from repository data without the local API', () => {
  const now = new Date('2026-09-11T10:30:00+05:30');
  const source = {
    profile: { id: 'student', fullName: 'Yash', email: 'yash@example.com', studentId: '1', college: '', course: 'BSc', department: '', semester: '5', preferredLanguage: 'English', updatedAt: '' },
    subjects: [{ id: 'math', name: 'Math', code: 'M1', facultyName: '', credits: 4, difficulty: 'Medium', strengthLevel: 'Average', attendanceTarget: 75, colour: '#000', createdAt: '', updatedAt: '' }],
    assignments: [{ id: 'assignment', subjectId: 'math', title: 'Worksheet', description: '', deadline: '2026-09-10T10:00:00+05:30', estimatedMinutes: 30, difficulty: 'Medium', priority: 'Medium', completedAt: null, createdAt: '', updatedAt: '' }],
    timetable: [{ id: 'lecture', subjectId: 'math', dayOfWeek: 'Friday', startTime: '11:00', endTime: '12:00', facultyName: '', classroom: '101', onlineLink: '', lectureType: '', createdAt: '', updatedAt: '' }],
    examinations: [], notices: [], todos: [], records: [],
    attendance: { subjects: [{ subjectId: 'math', name: 'Math', code: 'M1', colour: '#000', threshold: 75, totalClasses: 10, presentClasses: 6, absentClasses: 4, cancelledClasses: 0, percentage: 60, safeBunks: 0, recoveryClasses: 6, status: 'danger', afterAttending: 63.64, afterMissing: 54.55 }], records: [], todayLectures: [], stats: { totalClasses: 10, totalPresent: 6, overallPercentage: 60, atRiskCount: 1, safeCount: 0 } },
  } as unknown as DashboardSourceData;
  const summary = buildDashboardSummary(source, now);
  assert.equal(summary.student.fullName, 'Yash');
  assert.equal(summary.assignments.overdueCount, 1);
  assert.equal(summary.attendance.overallPercentage, 60);
  assert.equal(summary.todayLectures[0]?.status, 'upcoming');
  assert.equal(summary.nextBestAction?.targetRoute, '/academics');
  assert.equal(summary.attendanceToday?.status, 'MUST_ATTEND');
  assert.equal(summary.bottleneck?.targetId, 'assignment');
  assert.equal(summary.capacity.requiredMinutes, 30);
  assert.ok(summary.studentState.state_version.startsWith('v1-'));
  const after = buildDashboardSummary({ ...source, assignments: [{ ...source.assignments[0], completedAt: '2026-09-11T11:00:00+05:30' }] } as DashboardSourceData, now);
  assert.notEqual(after.studentState.state_version, summary.studentState.state_version);
  assert.notEqual(after.nextBestAction?.targetId, summary.nextBestAction?.targetId);
});
