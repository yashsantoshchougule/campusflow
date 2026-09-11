export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DashboardTask { id: string; targetId: string; type: string; title: string; subject?: string; deadline?: string; score: number; level: PriorityLevel; reason: string; reasons: string[]; suggestedAction?: string; targetRoute: string; }
export interface DashboardSummary {
  student: { id: string; fullName: string; currentDate: string; semester?: number | null; course?: string | null };
  todayLectures: Array<{ id: string; subjectId?: string; subject: string; subjectCode?: string; startTime: string; endTime: string; facultyName?: string; location?: string; onlineLink?: string; status: 'upcoming' | 'ongoing' | 'completed' }>;
  assignments: { pending: DashboardTask[]; overdue: DashboardTask[]; dueSoon: DashboardTask[]; pendingCount: number; overdueCount: number };
  upcomingExams: Array<{ id: string; title: string; subject?: string; startsAt: string; daysRemaining: number; examType?: string; syllabus?: string; preparationProgress?: number }>;
  attendance: { overallPercentage: number | null; totalClasses: number; totalPresent: number; subjectWarnings: AttendanceSubjectSummary[]; atRiskSubjects: string[]; subjects: AttendanceSubjectSummary[] };
  importantNotices: Array<{ id: string; title: string; deadline?: string; summary?: string; category?: string; sourceDocumentUrl?: string; updatedAt?: string; importance: string; targetRoute: string }>;
  priorityTasks: DashboardTask[];
  academicRisk: { level: 'safe' | 'moderate' | 'high' | 'critical'; score: number; reasons: string[]; recommendedAction: string };
  nextBestAction: (DashboardTask & { explanation?: string }) | null;
  studyTasks: { pending: DashboardTask[]; overdue: DashboardTask[]; completedCount: number; pendingCount: number };
  weeklyProgress: { completedTasks: number; pendingTasks: number; totalTasks: number; percentage: number; subjectProgress: Array<{ subject: string; completedTasks: number; totalTasks: number; percentage: number }> };
  studentState: { state_version: string; generated_at: string; data_freshness: 'fresh' | 'partial' | 'stale'; missing_data: string[]; warnings: string[]; source_ids: string[] };
  attendanceToday: { lectureId: string; subjectId: string; subject: string; startTime: string; currentPercentage: number | null; afterAttending: number | null; afterMissing: number | null; officialThreshold: number | null; safetyTarget: number | null; status: 'MUST_ATTEND' | 'ATTEND_RECOMMENDED' | 'ABOVE_BUFFER' | 'INSUFFICIENT_DATA' | 'NOT_COUNTABLE_OR_CANCELLED'; reason: string; sourceIds: string[] } | null;
  capacity: { availableMinutes: number; requiredMinutes: number; surplusMinutes: number; conflicts: string[]; usedFallbackEstimate: boolean; assumption: string };
  bottleneck: (DashboardTask & { sourceIds: string[] }) | null;
  why: { facts: string[]; inferences: string[]; confidence: 'high' | 'medium'; sourceIds: string[] } | null;
}

export interface AttendanceSubjectSummary { id: string; subject: string; presentClasses: number; totalClasses: number; percentage: number; threshold: number; safeBunks: number; requiredClasses: number; status: 'safe' | 'warning' | 'danger'; afterAttending: number; afterMissing: number; }

export interface AssignmentInput { title: string; subject?: string; dueAt: string; description?: string; }
export interface AttendanceQuickUpdate { subject: string; date: string; status: 'present' | 'absent'; }
export interface StudyTaskInput { title: string; subject?: string; dueAt?: string; scheduledFor?: string; reminderAt?: string; }
