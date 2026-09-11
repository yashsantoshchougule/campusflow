/** Reminder CRUD adapted from TacticalReader/Calendar-App, Apache-2.0. */
import type { CalendarRepository } from './repository';
import { calendarRepository } from './repository.ts';
import type { Reminder, ReminderInput } from './models';

const validate = (input: ReminderInput) => {
  if (!input.title.trim()) throw new Error('Reminder title is required.');
  if (!input.reminderAt || Number.isNaN(new Date(input.reminderAt).getTime())) throw new Error('Enter a valid reminder date and time.');
};

export class ReminderService {
  private readonly repository: CalendarRepository;
  constructor(repository: CalendarRepository = calendarRepository) { this.repository = repository; }

  async createReminder(input: ReminderInput, now = new Date()) {
    validate(input);
    const timestamp = now.toISOString();
    const reminder: Reminder = { ...input, title: input.title.trim(), reminderAt: new Date(input.reminderAt).toISOString(), id: crypto.randomUUID(), status: 'active', createdAt: timestamp, updatedAt: timestamp };
    return this.repository.saveReminder(reminder);
  }

  async updateReminder(id: string, input: ReminderInput, now = new Date()) {
    validate(input);
    const current = (await this.repository.getReminders()).find((item) => item.id === id);
    if (!current) throw new Error('Reminder not found.');
    return this.repository.saveReminder({ ...current, ...input, id, title: input.title.trim(), reminderAt: new Date(input.reminderAt).toISOString(), updatedAt: now.toISOString() });
  }

  async deleteReminder(id: string) { await this.repository.deleteReminder(id); }

  async completeReminder(id: string, now = new Date()) { return this.setStatus(id, 'completed', now); }
  async reopenReminder(id: string, now = new Date()) { return this.setStatus(id, 'active', now); }

  private async setStatus(id: string, status: Reminder['status'], now: Date) {
    const reminder = (await this.repository.getReminders()).find((item) => item.id === id);
    if (!reminder) throw new Error('Reminder not found.');
    return this.repository.saveReminder({ ...reminder, status, completedAt: status === 'completed' ? now.toISOString() : undefined, updatedAt: now.toISOString() });
  }

  async getOverdueReminders(now = new Date()) {
    return (await this.repository.getReminders()).filter((item) => item.status === 'active' && new Date(item.reminderAt) < now).sort((a, b) => a.reminderAt.localeCompare(b.reminderAt));
  }

  async getUpcomingReminders(now = new Date()) {
    return (await this.repository.getReminders()).filter((item) => item.status === 'active' && new Date(item.reminderAt) >= now).sort((a, b) => a.reminderAt.localeCompare(b.reminderAt));
  }
}

export const reminderService = new ReminderService();
