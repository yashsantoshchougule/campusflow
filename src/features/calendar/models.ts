/**
 * Calendar model shape adapted from yassir-jeraidi/full-calendar.
 * Copyright (c) 2025 Jeraidi Yassir, MIT License.
 */
export type CalendarView = 'month' | 'week';
export type ReminderStatus = 'active' | 'completed';
export type CalendarEventType = 'assignment' | 'examination' | 'study_session' | 'lecture' | 'notice' | 'atkt_deadline' | 'reminder';

export interface CalendarEvent {
  id: string;
  sourceId: string;
  sourceType: CalendarEventType;
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay: boolean;
  subjectId?: string;
  subjectName?: string;
  colour: string;
  isEditable: boolean;
  isDeletable: boolean;
  navigationPath?: string;
  metadata?: Record<string, unknown>;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderAt: string;
  subjectId?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  status: ReminderStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarFilters {
  subjectId?: string;
  eventTypes: CalendarEventType[];
  includeCompletedReminders: boolean;
}

export interface CalendarPreferences {
  view: CalendarView;
  selectedDate: string;
  filters: CalendarFilters;
}

export type ReminderInput = Pick<Reminder, 'title' | 'reminderAt'> & Partial<Pick<Reminder, 'description' | 'subjectId' | 'linkedEntityType' | 'linkedEntityId'>>;

