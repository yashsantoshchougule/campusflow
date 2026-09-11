import type { CalendarEventType } from './models';

export const EVENT_COLOURS: Record<CalendarEventType, string> = {
  assignment: '#7C3AED', examination: '#DC2626', study_session: '#2563EB', lecture: '#16A34A',
  notice: '#D97706', atkt_deadline: '#EA580C', reminder: '#DB2777',
};

export const EVENT_LABELS: Record<CalendarEventType, string> = {
  assignment: 'Assignment', examination: 'Examination', study_session: 'Study session', lecture: 'Lecture',
  notice: 'Notice deadline', atkt_deadline: 'ATKT deadline', reminder: 'Reminder',
};

