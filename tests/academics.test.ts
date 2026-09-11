import test from 'node:test';
import assert from 'node:assert/strict';
import { getAssignmentStatus, getDeadlineWarning, getExamDaysRemaining, getExamPriority, hasTimetableConflict } from '../src/features/academics/utils.ts';
import { validateAssignment, validateSubject } from '../src/features/academics/validations.ts';
import { mockAcademicRepository, subjectFromRow } from '../src/features/academics/repository.ts';
import type { Assignment, Subject, TimetableEntry } from '../src/features/academics/models.ts';

const now = new Date('2026-01-10T12:00:00Z');
const assignment = (deadline: string, completedAt: string | null = null) => ({ deadline, completedAt } as Assignment);

test('assignment status and deadline warnings are deterministic', () => {
  assert.equal(getAssignmentStatus(assignment('2026-01-10T11:00:00Z'), now), 'Overdue');
  assert.equal(getAssignmentStatus(assignment('2026-01-11T11:00:00Z'), now), 'Pending');
  assert.equal(getAssignmentStatus(assignment('2026-01-09T11:00:00Z', '2026-01-09T10:00:00Z'), now), 'Completed');
  assert.equal(getDeadlineWarning(assignment('2026-01-11T11:00:00Z'), now), 'Due within 24 hours');
  assert.equal(getDeadlineWarning(assignment('2026-01-12T12:00:00Z'), now), 'Due within three days');
});

test('shared course subjects map to the Academic page model', () => {
  const subject = subjectFromRow({ id: 'math', name: 'Mathematics', code: 'MA101', minimum_attendance_percentage: '80', created_at: '', updated_at: '' });
  assert.equal(subject.attendanceTarget, 80);
  assert.equal(subject.difficulty, 'Medium');
});

test('overlapping timetable ranges conflict only on the same day', () => {
  const existing = [{ id: '1', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00' }] as TimetableEntry[];
  assert.equal(hasTimetableConflict({ id: '2', dayOfWeek: 'Monday', startTime: '09:30', endTime: '10:30' }, existing), true);
  assert.equal(hasTimetableConflict({ id: '2', dayOfWeek: 'Tuesday', startTime: '09:30', endTime: '10:30' }, existing), false);
  assert.equal(hasTimetableConflict({ id: '2', dayOfWeek: 'Monday', startTime: '10:00', endTime: '11:00' }, existing), false);
});

test('exam days and priority use date, preparation and difficulty', () => {
  assert.equal(getExamDaysRemaining('2026-01-12T12:00:00Z', now), 2);
  assert.equal(getExamPriority({ examDate: '2026-01-12T12:00:00Z', preparationProgress: 10 }, 'Hard', now), 'High');
  assert.equal(getExamPriority({ examDate: '2026-03-12T12:00:00Z', preparationProgress: 100 }, 'Easy', now), 'Low');
});

test('subject and assignment validation catches invalid input', () => {
  const subject = { id: '1', code: 'CS101' } as Subject;
  assert.equal(validateSubject({ name: '', code: 'cs101', facultyName: '', credits: -1, difficulty: 'Easy', strengthLevel: 'Weak', attendanceTarget: 101, colour: '#000000' }, [subject]).code, 'Subject code must be unique.');
  assert.equal(validateAssignment({ subjectId: '', title: '', description: '', deadline: '', estimatedMinutes: 0, difficulty: 'Easy', priority: 'Low' }).subjectId, 'Subject is required.');
});

test('repository persists create, update and delete operations', async () => {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  const created = await mockAcademicRepository.createSubject({ name: 'Algorithms', code: 'CS201', facultyName: 'Dr Ada', credits: 4, difficulty: 'Hard', strengthLevel: 'Average', attendanceTarget: 80, colour: '#123456' });
  assert.equal((await mockAcademicRepository.getSubjects())[0]?.name, 'Algorithms');
  await mockAcademicRepository.updateSubject(created.id, { ...created, name: 'Advanced Algorithms' });
  assert.equal((await mockAcademicRepository.getSubjects())[0]?.name, 'Advanced Algorithms');
  await mockAcademicRepository.deleteSubject(created.id);
  assert.equal((await mockAcademicRepository.getSubjects()).length, 0);
});
