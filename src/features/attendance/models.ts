export type AttendanceMark = 'present' | 'absent' | 'cancelled';
export type AttendanceRisk = 'safe' | 'warning' | 'danger';
export type AttendanceDecisionStatus = 'MUST_ATTEND' | 'ATTEND_RECOMMENDED' | 'ABOVE_BUFFER' | 'INSUFFICIENT_DATA' | 'NOT_COUNTABLE_OR_CANCELLED';

export interface AttendanceDecision {
  status: AttendanceDecisionStatus;
  reason: string;
  currentPercentage: number | null;
  afterAttending: number | null;
  afterMissing: number | null;
  officialThreshold: number | null;
  safetyTarget: number | null;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  timetableEntryId: string | null;
  date: string;
  status: AttendanceMark;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceRecordInput = Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface AttendanceSubjectContext {
  subjectId: string;
  name: string;
  code: string;
  colour: string;
  threshold: number;
}

export interface AttendanceSubjectSummary extends AttendanceSubjectContext {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  cancelledClasses: number;
  percentage: number;
  safeBunks: number;
  recoveryClasses: number | null;
  status: AttendanceRisk;
  afterAttending: number;
  afterMissing: number;
}

export interface AttendanceStats {
  totalClasses: number;
  totalPresent: number;
  overallPercentage: number;
  atRiskCount: number;
  safeCount: number;
}

export interface AttendanceForecast {
  presentClasses: number;
  totalClasses: number;
  percentage: number;
  safeBunks: number;
  recoveryClasses: number | null;
  status: AttendanceRisk;
}

export interface TimetableAttendanceLink {
  id: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface TodayLecture extends TimetableAttendanceLink {
  subjectName: string;
  attendanceStatus: AttendanceMark | null;
}

export interface DateRangeProjection extends AttendanceForecast {
  subjectId: string;
  subjectName: string;
  scheduledClasses: number;
}

export interface AttendanceDashboard {
  subjects: AttendanceSubjectSummary[];
  records: AttendanceRecord[];
  todayLectures: TodayLecture[];
  stats: AttendanceStats;
}
