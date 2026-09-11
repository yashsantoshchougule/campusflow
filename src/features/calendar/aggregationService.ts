/**
 * Repository aggregation pattern adapted from diegnghtmr/vale src/services/api.ts
 * and hooks/useCourses.ts. Copyright (c) 2025 Diego Alejandro Flores Quintero, MIT.
 * Range-bound occurrence expansion adapts TacticalReader/Calendar-App
 * src/utils/recurrence.js, Apache-2.0.
 */
import type { Assignment, Examination, Subject, TimetableEntry } from '../academics/models';
import { academicsService } from '../academics/service.ts';
import { mockAcademicRepository, type AcademicRepository } from '../academics/repository.ts';
import type { NoticeActionLink, NoticeDraft } from '../notices/models';
import { LocalNoticeActionLinkRepository, LocalNoticeRepository, SupabaseNoticeActionLinkRepository, SupabaseNoticeRepository, type NoticeActionLinkRepository, type NoticeRepository } from '../notices/repositories.ts';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';
import { EVENT_COLOURS } from './config.ts';
import type { CalendarEvent, Reminder } from './models';
import type { CalendarRepository } from './repository';
import { calendarRepository } from './repository.ts';
import { toLocalDateKey, type DateRange } from './calendarService.ts';

export interface StudySessionSource { id: string; title: string; start: string; end?: string; description?: string; subjectId?: string; status?: string }
export interface AtktDeadlineSource { id: string; title: string; deadline: string; description?: string; subjectId?: string; status: string }
export interface CalendarSources {
  subjects: Subject[];
  assignments: Assignment[];
  examinations: Examination[];
  timetableEntries: TimetableEntry[];
  studySessions: StudySessionSource[];
  notices: NoticeDraft[];
  noticeLinks: NoticeActionLink[];
  atktDeadlines: AtktDeadlineSource[];
  reminders: Reminder[];
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const normaliseDate = (value: string) => {
  const date = new Date(isDateOnly(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return isDateOnly(value) ? value : date.toISOString();
};
const allDayDate = (value: string) => {
  if (isDateOnly(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : toLocalDateKey(date);
};

export function aggregateCalendarEvents(sources: CalendarSources, range: DateRange): CalendarEvent[] {
  const subjectMap = new Map(sources.subjects.map((subject) => [subject.id, subject]));
  const events = new Map<string, CalendarEvent>();
  const derived = (event: Omit<CalendarEvent, 'colour' | 'isEditable' | 'isDeletable'>) => {
    const id = `${event.sourceType}:${event.id}`;
    if (!events.has(id)) events.set(id, { ...event, id, colour: EVENT_COLOURS[event.sourceType], isEditable: false, isDeletable: false });
  };

  for (const assignment of sources.assignments) {
    const start = normaliseDate(assignment.deadline); if (!start) continue;
    const subject = subjectMap.get(assignment.subjectId);
    derived({ id: assignment.id, sourceId: assignment.id, sourceType: 'assignment', title: assignment.title, description: assignment.description, start, allDay: isDateOnly(assignment.deadline), subjectId: assignment.subjectId, subjectName: subject?.name, navigationPath: '/academics', metadata: { priority: assignment.priority, completedAt: assignment.completedAt } });
  }

  for (const examination of sources.examinations) {
    const start = normaliseDate(examination.examDate); if (!start) continue;
    const subject = subjectMap.get(examination.subjectId);
    derived({ id: examination.id, sourceId: examination.id, sourceType: 'examination', title: examination.name, description: examination.topics, start, allDay: isDateOnly(examination.examDate), subjectId: examination.subjectId, subjectName: subject?.name, navigationPath: '/academics', metadata: { room: examination.room, examinationType: examination.examinationType } });
  }

  const date = new Date(range.start);
  while (date <= range.end) {
    const dateKey = toLocalDateKey(date);
    for (const lecture of sources.timetableEntries.filter((item) => item.dayOfWeek === dayNames[date.getDay()])) {
      const subject = subjectMap.get(lecture.subjectId);
      derived({ id: `${lecture.id}:${dateKey}`, sourceId: lecture.id, sourceType: 'lecture', title: subject?.name ?? 'Lecture', description: [lecture.lectureType, lecture.classroom, lecture.facultyName].filter(Boolean).join(' · '), start: `${dateKey}T${lecture.startTime}`, end: `${dateKey}T${lecture.endTime}`, allDay: false, subjectId: lecture.subjectId, subjectName: subject?.name, navigationPath: '/academics', metadata: { timetableEntryId: lecture.id, onlineLink: lecture.onlineLink } });
    }
    date.setDate(date.getDate() + 1);
  }

  for (const session of sources.studySessions) {
    if (session.status === 'cancelled') continue;
    const start = normaliseDate(session.start); if (!start) continue;
    const subject = session.subjectId ? subjectMap.get(session.subjectId) : undefined;
    derived({ id: session.id, sourceId: session.id, sourceType: 'study_session', title: session.title, description: session.description, start, end: session.end ? normaliseDate(session.end) ?? undefined : undefined, allDay: isDateOnly(session.start), subjectId: session.subjectId, subjectName: subject?.name, navigationPath: '/study-planner' });
  }

  const atktNoticeIds = new Set(sources.noticeLinks.filter((link) => link.type === 'atkt_application').map((link) => link.noticeId));
  for (const notice of sources.notices) {
    if (notice.status !== 'confirmed' || !notice.deadline.value) continue;
    const start = allDayDate(notice.deadline.value); if (!start) continue;
    const isAtkt = notice.category.value === 'ATKT' || atktNoticeIds.has(notice.id);
    derived({ id: notice.id, sourceId: notice.id, sourceType: isAtkt ? 'atkt_deadline' : 'notice', title: notice.title.value ?? (isAtkt ? 'ATKT deadline' : 'Notice deadline'), description: notice.instructions.value?.join('\n'), start, allDay: true, navigationPath: '/notices', metadata: { version: notice.version, category: notice.category.value } });
  }

  for (const deadline of sources.atktDeadlines) {
    if (deadline.status !== 'confirmed') continue;
    const start = allDayDate(deadline.deadline); if (!start) continue;
    const subject = deadline.subjectId ? subjectMap.get(deadline.subjectId) : undefined;
    derived({ id: deadline.id, sourceId: deadline.id, sourceType: 'atkt_deadline', title: deadline.title, description: deadline.description, start, allDay: true, subjectId: deadline.subjectId, subjectName: subject?.name, navigationPath: '/notices' });
  }

  for (const reminder of sources.reminders) {
    const start = normaliseDate(reminder.reminderAt); if (!start) continue;
    const subject = reminder.subjectId ? subjectMap.get(reminder.subjectId) : undefined;
    const id = `reminder:${reminder.id}`;
    if (!events.has(id)) events.set(id, { id, sourceId: reminder.id, sourceType: 'reminder', title: reminder.title, description: reminder.description, start, allDay: false, subjectId: reminder.subjectId, subjectName: subject?.name, colour: EVENT_COLOURS.reminder, isEditable: true, isDeletable: true, metadata: { status: reminder.status, completedAt: reminder.completedAt, linkedEntityType: reminder.linkedEntityType, linkedEntityId: reminder.linkedEntityId } });
  }

  return [...events.values()];
}

const readArray = <T>(keys: string[]): T[] => {
  if (typeof localStorage === 'undefined') return [];
  for (const key of keys) try { const value = JSON.parse(localStorage.getItem(key) ?? '[]'); if (Array.isArray(value) && value.length) return value as T[]; } catch { /* malformed source data is ignored */ }
  return [];
};

async function plannerSources() {
  if (!hasSupabaseConfiguration()) return {
    studySessions: readArray<StudySessionSource>(['campusflow_study_sessions', 'studybuddy.study-planner.sessions.v1']),
    atktDeadlines: readArray<AtktDeadlineSource>(['campusflow_atkt_applications', 'studybuddy.atkt.applications.v1']),
  };
  const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
  const [sessions, atkt] = await Promise.all([
    supabase.from('study_sessions').select('*').eq('user_id', user.id), supabase.from('atkt_applications').select('*').eq('user_id', user.id),
  ]);
  if (sessions.error) throw sessions.error;
  if (atkt.error) throw atkt.error;
  return {
    studySessions: (sessions.data ?? []).map((item: any) => ({ id: item.id, title: item.title, start: item.start_at, end: item.end_at, subjectId: item.subject_id ?? undefined, status: item.status })),
    atktDeadlines: (atkt.data ?? []).filter((item: any) => item.deadline).map((item: any) => ({ id: item.id, title: item.title, deadline: item.deadline, description: item.description ?? undefined, subjectId: item.subject_id ?? undefined, status: item.status })),
  };
}

export class CalendarAggregationService {
  private readonly academics: AcademicRepository;
  private readonly notices: NoticeRepository;
  private readonly noticeLinks: NoticeActionLinkRepository;
  private readonly calendar: CalendarRepository;
  constructor(
    academics: AcademicRepository = hasSupabaseConfiguration() ? academicsService : mockAcademicRepository,
    notices: NoticeRepository = hasSupabaseConfiguration() ? new SupabaseNoticeRepository() : new LocalNoticeRepository(),
    noticeLinks: NoticeActionLinkRepository = hasSupabaseConfiguration() ? new SupabaseNoticeActionLinkRepository() : new LocalNoticeActionLinkRepository(),
    calendar: CalendarRepository = calendarRepository,
  ) { this.academics = academics; this.notices = notices; this.noticeLinks = noticeLinks; this.calendar = calendar; }

  async getEvents(range: DateRange) {
    const [subjects, assignments, examinations, timetableEntries, notices, noticeLinks, reminders, planner] = await Promise.all([
      this.academics.getSubjects(), this.academics.getAssignments(), this.academics.getExaminations(), this.academics.getTimetableEntries(),
      this.notices.list(), this.noticeLinks.list(), this.calendar.getReminders(), plannerSources(),
    ]);
    return aggregateCalendarEvents({
      subjects, assignments, examinations, timetableEntries, notices, noticeLinks, reminders,
      ...planner,
    }, range);
  }
}

export const calendarAggregationService = new CalendarAggregationService();
