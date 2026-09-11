/**
 * Month/week structure and selection behavior adapted from
 * yassir-jeraidi/full-calendar (MIT, Copyright (c) 2025 Jeraidi Yassir).
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { mockAcademicRepository } from '../features/academics/repository';
import type { Subject } from '../features/academics/models';
import { calendarAggregationService } from '../features/calendar/aggregationService';
import { calendarService, toLocalDateKey, type DateRange } from '../features/calendar/calendarService';
import { EVENT_COLOURS, EVENT_LABELS } from '../features/calendar/config';
import type { CalendarEvent, CalendarEventType, CalendarPreferences, Reminder, ReminderInput } from '../features/calendar/models';
import { calendarRepository } from '../features/calendar/repository';
import { reminderService } from '../features/calendar/reminderService';
import './CalendarPage.css';

const eventTypes = Object.keys(EVENT_COLOURS) as CalendarEventType[];
const emptyForm: ReminderInput = { title: '', description: '', reminderAt: '', subjectId: '', linkedEntityType: '', linkedEntityId: '' };
const daysIn = ({ start, end }: DateRange) => {
  const values: Date[] = []; const cursor = new Date(start);
  while (cursor <= end) { values.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
  return values;
};
const localInput = (value: string) => {
  const date = new Date(value); const offset = date.getTimezoneOffset() * 60000;
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const eventTime = (event: CalendarEvent) => event.allDay ? 'All day' : new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const labelRange = (view: CalendarPreferences['view'], range: DateRange, selected: Date) => view === 'month'
  ? selected.toLocaleDateString([], { month: 'long', year: 'numeric' })
  : `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()}`;

export default function CalendarPage() {
  const [preferences, setPreferences] = useState<CalendarPreferences>({ view: 'month', selectedDate: new Date().toISOString(), filters: { eventTypes: [], includeCompletedReminders: false } });
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [overdue, setOverdue] = useState<Reminder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<ReminderInput>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');

  const selectedDate = useMemo(() => {
    const value = new Date(preferences.selectedDate); return Number.isNaN(value.getTime()) ? new Date() : value;
  }, [preferences.selectedDate]);
  const visibleRange = useMemo(() => preferences.view === 'month' ? calendarService.getMonthRange(selectedDate) : calendarService.getWeekRange(selectedDate), [preferences.view, selectedDate]);

  const fetchData = useCallback(async () => {
    const now = new Date(); const future = new Date(now); future.setDate(future.getDate() + 90);
    const range = { start: visibleRange.start < now ? visibleRange.start : now, end: visibleRange.end > future ? visibleRange.end : future };
    return Promise.all([calendarAggregationService.getEvents(range), mockAcademicRepository.getSubjects(), reminderService.getOverdueReminders(now)]);
  }, [visibleRange]);
  const refresh = useCallback(async () => {
    const [nextEvents, nextSubjects, nextOverdue] = await fetchData();
    setEvents(nextEvents); setSubjects(nextSubjects); setOverdue(nextOverdue);
  }, [fetchData]);

  useEffect(() => { void calendarRepository.getPreferences().then((value) => { setPreferences(value); setReady(true); }); }, []);
  useEffect(() => {
    if (!ready) return;
    void calendarRepository.savePreferences(preferences);
    void fetchData().then(([nextEvents, nextSubjects, nextOverdue]) => { setEvents(nextEvents); setSubjects(nextSubjects); setOverdue(nextOverdue); });
  }, [fetchData, preferences, ready]);

  const filtered = useMemo(() => calendarService.applyFilters(events, preferences.filters), [events, preferences.filters]);
  const visibleEvents = useMemo(() => calendarService.getEventsForRange(filtered, visibleRange), [filtered, visibleRange]);
  const upcoming = useMemo(() => calendarService.getUpcomingEvents(filtered).slice(0, 12), [filtered]);
  const selected = calendarService.getEventDetails(events, selectedId);
  const calendarDays = useMemo(() => daysIn(visibleRange), [visibleRange]);
  const shownOverdue = overdue.filter((item) => (!preferences.filters.subjectId || item.subjectId === preferences.filters.subjectId) && (preferences.filters.eventTypes.length === 0 || preferences.filters.eventTypes.includes('reminder')));

  const changePreferences = (change: Partial<CalendarPreferences>) => setPreferences((current) => ({ ...current, ...change }));
  const changeFilters = (change: Partial<CalendarPreferences['filters']>) => setPreferences((current) => ({ ...current, filters: { ...current.filters, ...change } }));
  const move = (direction: -1 | 1) => changePreferences({ selectedDate: calendarService.navigate(selectedDate, preferences.view, direction).toISOString() });
  const chooseEvent = (event: CalendarEvent) => setSelectedId(event.id);
  const openCreate = () => { setEditingId(''); setForm(emptyForm); setFormOpen(true); setMessage(''); };
  const openEdit = async (event: CalendarEvent) => {
    const reminder = (await calendarRepository.getReminders()).find((item) => item.id === event.sourceId); if (!reminder) return;
    setEditingId(reminder.id); setForm({ title: reminder.title, description: reminder.description ?? '', reminderAt: localInput(reminder.reminderAt), subjectId: reminder.subjectId ?? '', linkedEntityType: reminder.linkedEntityType ?? '', linkedEntityId: reminder.linkedEntityId ?? '' }); setFormOpen(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage('');
    try { if (editingId) await reminderService.updateReminder(editingId, form); else await reminderService.createReminder(form); setFormOpen(false); setEditingId(''); setForm(emptyForm); await refresh(); setMessage('Reminder saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save reminder.'); }
  };
  const remove = async (event: CalendarEvent) => {
    if (!window.confirm(`Delete “${event.title}”?`)) return;
    await reminderService.deleteReminder(event.sourceId); setSelectedId(''); await refresh(); setMessage('Reminder deleted.');
  };
  const setCompleted = async (event: CalendarEvent, completed: boolean) => {
    if (completed) await reminderService.completeReminder(event.sourceId); else await reminderService.reopenReminder(event.sourceId);
    await refresh(); setSelectedId(''); setMessage(completed ? 'Reminder completed.' : 'Reminder reopened.');
  };

  const eventButton = (event: CalendarEvent) => <button key={event.id} className={`calendar-event ${event.metadata?.status === 'completed' ? 'completed' : ''}`} style={{ borderLeftColor: event.colour }} onClick={() => chooseEvent(event)} title={event.title}><span>{event.allDay ? '' : eventTime(event)} </span>{event.title}</button>;

  return <section className="calendar-page">
    <header><h1>Calendar and Reminders</h1><p>A read-only academic timeline with personal reminders you control.</p></header>
    {message && <p className="calendar-message" role="status">{message}</p>}

    <div className="calendar-toolbar" aria-label="Calendar controls">
      <div><button className={preferences.view === 'month' ? 'active' : ''} onClick={() => changePreferences({ view: 'month' })}>Month</button><button className={preferences.view === 'week' ? 'active' : ''} onClick={() => changePreferences({ view: 'week' })}>Week</button></div>
      <div><button onClick={() => move(-1)}>Previous</button><button onClick={() => changePreferences({ selectedDate: new Date().toISOString() })}>Today</button><button onClick={() => move(1)}>Next</button></div>
      <strong>{labelRange(preferences.view, visibleRange, selectedDate)}</strong>
    </div>

    <div className="calendar-filters">
      <label>Subject<select value={preferences.filters.subjectId ?? ''} onChange={(event) => changeFilters({ subjectId: event.target.value || undefined })}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
      <label>Event type<select value={preferences.filters.eventTypes[0] ?? ''} onChange={(event) => changeFilters({ eventTypes: event.target.value ? [event.target.value as CalendarEventType] : [] })}><option value="">All event types</option>{eventTypes.map((type) => <option key={type} value={type}>{EVENT_LABELS[type]}</option>)}</select></label>
      <label className="calendar-check"><input type="checkbox" checked={preferences.filters.includeCompletedReminders} onChange={(event) => changeFilters({ includeCompletedReminders: event.target.checked })} /> Include completed reminders</label>
      <button onClick={() => changeFilters({ subjectId: undefined, eventTypes: [], includeCompletedReminders: false })}>Clear filters</button>
    </div>

    <div className="calendar-legend" aria-label="Event colour legend">{eventTypes.map((type) => <span key={type}><i style={{ background: EVENT_COLOURS[type] }} />{EVENT_LABELS[type]}</span>)}</div>

    <section className={`calendar-grid ${preferences.view}`} aria-label={`${preferences.view} calendar`}>
      {calendarDays.map((day) => {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()); const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
        const dayEvents = calendarService.getEventsForRange(visibleEvents, { start: dayStart, end: dayEnd });
        return <article key={toLocalDateKey(day)} className={toLocalDateKey(day) === toLocalDateKey(new Date()) ? 'today' : ''}><h3>{day.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: preferences.view === 'week' ? 'short' : undefined })}</h3>{dayEvents.map(eventButton)}</article>;
      })}
      {visibleEvents.length === 0 && <p className="calendar-empty">No events match this date range and filters.</p>}
    </section>

    <div className="calendar-columns">
      <section className="calendar-panel"><h2>Upcoming events</h2>{upcoming.length === 0 ? <p>No upcoming events.</p> : <ol>{upcoming.map((event) => <li key={event.id}><button onClick={() => chooseEvent(event)}><i style={{ background: event.colour }} />{event.title}<small>{new Date(event.start).toLocaleString()}</small></button></li>)}</ol>}</section>
      <section className="calendar-panel"><h2>Overdue reminders</h2>{shownOverdue.length === 0 ? <p>No overdue reminders.</p> : <ul>{shownOverdue.map((item) => <li key={item.id}><button onClick={() => setSelectedId(`reminder:${item.id}`)}>{item.title}<small>{new Date(item.reminderAt).toLocaleString()}</small></button></li>)}</ul>}</section>
    </div>

    <button className="calendar-create" onClick={openCreate}>Create reminder</button>

    {selected && <aside className="calendar-detail" aria-label="Event details"><button className="calendar-close" aria-label="Close details" onClick={() => setSelectedId('')}>×</button><h2>{selected.title}</h2><p><span style={{ color: selected.colour }}>●</span> {EVENT_LABELS[selected.sourceType]}</p><p>{new Date(selected.start).toLocaleString()}{selected.end ? ` – ${new Date(selected.end).toLocaleString()}` : ''}</p>{selected.subjectName && <p>Subject: {selected.subjectName}</p>}{selected.description && <p>{selected.description}</p>}{selected.navigationPath && <Link to={selected.navigationPath}>Open source</Link>}{selected.sourceType === 'reminder' && <div className="calendar-actions"><button onClick={() => void openEdit(selected)}>Edit</button><button onClick={() => void setCompleted(selected, selected.metadata?.status !== 'completed')}>{selected.metadata?.status === 'completed' ? 'Reopen' : 'Mark completed'}</button><button className="danger" onClick={() => void remove(selected)}>Delete</button></div>}</aside>}

    {formOpen && <aside className="calendar-detail calendar-form"><button className="calendar-close" aria-label="Close reminder form" onClick={() => setFormOpen(false)}>×</button><h2>{editingId ? 'Edit reminder' : 'Create reminder'}</h2><form onSubmit={(event) => void save(event)}><label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>Description<textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Date and time<input type="datetime-local" value={form.reminderAt} onChange={(event) => setForm({ ...form, reminderAt: event.target.value })} required /></label><label>Subject<select value={form.subjectId ?? ''} onChange={(event) => setForm({ ...form, subjectId: event.target.value || undefined })}><option value="">No linked subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label><label>Linked item type<input value={form.linkedEntityType ?? ''} onChange={(event) => setForm({ ...form, linkedEntityType: event.target.value })} /></label><label>Linked item ID<input value={form.linkedEntityId ?? ''} onChange={(event) => setForm({ ...form, linkedEntityId: event.target.value })} /></label><button type="submit">Save reminder</button></form></aside>}
  </section>;
}
