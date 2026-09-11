import type { AssignmentInput, ExaminationInput, NoteInput, Subject, SubjectInput, TimetableEntryInput } from './models';

export type ValidationErrors = Record<string, string>;
const required = (value: string) => value.trim().length > 0;

export function validateSubject(input: SubjectInput, subjects: Subject[], currentId?: string): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(input.name)) errors.name = 'Subject name is required.';
  if (!required(input.code)) errors.code = 'Subject code is required.';
  else if (subjects.some((subject) => subject.id !== currentId && subject.code.toLowerCase() === input.code.trim().toLowerCase())) errors.code = 'Subject code must be unique.';
  if (!required(input.facultyName)) errors.facultyName = 'Faculty name is required.';
  if (!Number.isFinite(input.credits) || input.credits < 0) errors.credits = 'Credits must be zero or greater.';
  if (!Number.isFinite(input.attendanceTarget) || input.attendanceTarget < 1 || input.attendanceTarget > 100) errors.attendanceTarget = 'Attendance target must be between 1 and 100.';
  return errors;
}

export function validateAssignment(input: AssignmentInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(input.title)) errors.title = 'Title is required.';
  if (!input.subjectId) errors.subjectId = 'Subject is required.';
  if (!input.deadline || Number.isNaN(new Date(input.deadline).getTime())) errors.deadline = 'A valid deadline is required.';
  if (!Number.isFinite(input.estimatedMinutes) || input.estimatedMinutes < 1) errors.estimatedMinutes = 'Estimated time must be at least one minute.';
  return errors;
}

export function validateTimetableEntry(input: TimetableEntryInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.subjectId) errors.subjectId = 'Subject is required.';
  if (!input.startTime || !input.endTime || input.startTime >= input.endTime) errors.time = 'End time must be after start time.';
  if (input.onlineLink) {
    try { new URL(input.onlineLink); } catch { errors.onlineLink = 'Meeting link must be a valid URL.'; }
  }
  return errors;
}

export function validateExamination(input: ExaminationInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(input.name)) errors.name = 'Examination name is required.';
  if (!input.subjectId) errors.subjectId = 'Subject is required.';
  if (!input.examDate || Number.isNaN(new Date(input.examDate).getTime())) errors.examDate = 'A valid examination date is required.';
  if (input.preparationProgress < 0 || input.preparationProgress > 100) errors.preparationProgress = 'Progress must be between 0 and 100.';
  return errors;
}

export function validateNote(input: NoteInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(input.title)) errors.title = 'Title is required.';
  if (!input.subjectId) errors.subjectId = 'Subject is required.';
  if (input.noteType === 'text' && !required(input.textContent)) errors.textContent = 'Note text is required.';
  if (input.noteType === 'file' && !input.filePath) errors.file = 'Choose a supported file.';
  return errors;
}

export function validateNoteFile(file: File): string | null {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const supportedExtension = /\.(pdf|docx|txt|md|jpe?g|png|gif|webp)$/i.test(file.name);
  if (!allowed.includes(file.type) && !supportedExtension) return 'Only PDF, DOCX, TXT, Markdown, JPG, PNG, GIF and WebP files are supported.';
  if (file.size > 10 * 1024 * 1024) return 'File size must not exceed 10 MB.';
  return null;
}
