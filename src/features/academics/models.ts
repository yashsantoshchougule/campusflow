export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type StrengthLevel = 'Strong' | 'Average' | 'Weak';
export type Priority = 'Low' | 'Medium' | 'High';
export type AssignmentStatus = 'Completed' | 'Overdue' | 'Pending';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Subject {
  id: string;
  name: string;
  code: string;
  facultyName: string;
  credits: number;
  difficulty: Difficulty;
  strengthLevel: StrengthLevel;
  attendanceTarget: number;
  colour: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  deadline: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  priority: Priority;
  attachment?: FileMetadata;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntry {
  id: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  facultyName: string;
  classroom: string;
  onlineLink: string;
  lectureType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Examination {
  id: string;
  subjectId: string;
  name: string;
  examinationType: string;
  examDate: string;
  topics: string;
  room: string;
  preparationProgress: number;
  studyPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  noteType: 'text' | 'file';
  textContent: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  filePath: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicData {
  subjects: Subject[];
  assignments: Assignment[];
  timetableEntries: TimetableEntry[];
  examinations: Examination[];
  notes: Note[];
}

export type SubjectInput = Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>;
export type AssignmentInput = Omit<Assignment, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>;
export type TimetableEntryInput = Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type ExaminationInput = Omit<Examination, 'id' | 'createdAt' | 'updatedAt'>;
export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
