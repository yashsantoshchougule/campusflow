/**
 * Date navigation/range/filter logic adapted from yassir-jeraidi/full-calendar
 * helpers.ts and contexts/calendar-context.tsx. Copyright (c) 2025 Jeraidi Yassir, MIT.
 */
import type { CalendarEvent, CalendarFilters, CalendarView } from './models';

export interface DateRange { start: Date; end: Date }

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
const endOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
const mondayOffset = (value: Date) => (value.getDay() + 6) % 7;
const eventStart = (event: CalendarEvent) => new Date(event.allDay && /^\d{4}-\d{2}-\d{2}$/.test(event.start) ? `${event.start}T00:00:00` : event.start);
const eventEnd = (event: CalendarEvent) => event.end
  ? new Date(event.allDay && /^\d{4}-\d{2}-\d{2}$/.test(event.end) ? `${event.end}T23:59:59.999` : event.end)
  : event.allDay ? endOfDay(eventStart(event)) : eventStart(event);

export const toLocalDateKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

export class CalendarService {
  getMonthRange(value: Date): DateRange {
    const first = new Date(value.getFullYear(), value.getMonth(), 1);
    const last = new Date(value.getFullYear(), value.getMonth() + 1, 0);
    const start = new Date(first); start.setDate(first.getDate() - mondayOffset(first));
    const end = new Date(last); end.setDate(last.getDate() + (6 - mondayOffset(last)));
    return { start: startOfDay(start), end: endOfDay(end) };
  }

  getWeekRange(value: Date): DateRange {
    const start = startOfDay(value); start.setDate(start.getDate() - mondayOffset(start));
    const end = new Date(start); end.setDate(end.getDate() + 6);
    return { start, end: endOfDay(end) };
  }

  getEventsForRange(events: CalendarEvent[], range: DateRange) {
    return events.filter((event) => {
      const start = eventStart(event); const end = eventEnd(event);
      return !Number.isNaN(start.getTime()) && start <= range.end && end >= range.start;
    }).sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime() || Number(b.allDay) - Number(a.allDay) || a.title.localeCompare(b.title));
  }

  applyFilters(events: CalendarEvent[], filters: CalendarFilters) {
    return events.filter((event) => (!filters.subjectId || event.subjectId === filters.subjectId)
      && (filters.eventTypes.length === 0 || filters.eventTypes.includes(event.sourceType))
      && (filters.includeCompletedReminders || event.sourceType !== 'reminder' || event.metadata?.status !== 'completed'));
  }

  getUpcomingEvents(events: CalendarEvent[], now = new Date()) {
    return events.filter((event) => eventEnd(event) >= now).sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime());
  }

  getEventDetails(events: CalendarEvent[], id: string) { return events.find((event) => event.id === id) ?? null; }

  navigate(selected: Date, view: CalendarView, direction: -1 | 1) {
    const value = new Date(selected);
    if (view === 'month') value.setMonth(value.getMonth() + direction); else value.setDate(value.getDate() + direction * 7);
    return value;
  }
}

export const calendarService = new CalendarService();
