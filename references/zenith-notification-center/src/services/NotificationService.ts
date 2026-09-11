import { nanoid } from "nanoid";
import type {
  NotificationAdapter,
  NotificationAnalyticsEvents,
  NotificationItem,
  ToastOptions
} from "../types";

export class NotificationService {
  private listeners = new Set<(notifications: NotificationItem[]) => void>();

  constructor(
    private notifications: NotificationItem[] = [],
    private readonly adapter?: NotificationAdapter,
    private readonly analytics?: NotificationAnalyticsEvents
  ) {}

  getAll(): NotificationItem[] {
    return this.notifications;
  }

  setNotifications(notifications: NotificationItem[]): void {
    this.notifications = notifications;
    this.emit();
  }

  add(input: Partial<NotificationItem>): NotificationItem {
    const now = Date.now();

    const item: NotificationItem = {
      id: input.id ?? nanoid(),
      title: input.title ?? "Notification",
      message: input.message ?? "",
      description: input.description,
      icon: input.icon,
      image: input.image,
      avatar: input.avatar,
      timestamp: input.timestamp ?? now,
      createdAt: input.createdAt ?? new Date(now).toISOString(),
      updatedAt: input.updatedAt ?? new Date(now).toISOString(),
      type: input.type ?? "info",
      category: input.category ?? "general",
      priority: input.priority ?? "medium",
      status: input.status ?? "new",
      read: input.read ?? false,
      archived: input.archived ?? false,
      starred: input.starred ?? false,
      pinned: input.pinned ?? false,
      actionUrl: input.actionUrl,
      buttons: input.buttons,
      metadata: input.metadata,
      tags: input.tags,
      sender: input.sender,
      groupId: input.groupId,
      expiresAt: input.expiresAt,
      progress: input.progress,
      attachments: input.attachments,
      sound: input.sound,
      vibration: input.vibration,
      deliveryStatus: input.deliveryStatus,
      isOffline: input.isOffline,
      retryCount: input.retryCount,
      customData: input.customData
    };

    this.notifications = [item, ...this.notifications];
    this.analytics?.onNotificationReceived?.(item);
    this.emit();
    return item;
  }

  fromToast(options: ToastOptions): NotificationItem {
    return this.add({
      id: options.id,
      title: options.title,
      message: options.message ?? "",
      description: options.description,
      type: options.type ?? "info",
      category: "toast",
      metadata: {
        duration: options.duration,
        persistent: options.persistent,
        position: options.position,
        ...options.metadata
      }
    });
  }

  update(id: string, patch: Partial<NotificationItem>): void {
    this.notifications = this.notifications.map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
    );
    this.emit();
  }

  remove(id: string): void {
    const removed = this.notifications.find((item) => item.id === id);
    this.notifications = this.notifications.filter((item) => item.id !== id);
    if (removed) this.analytics?.onNotificationDeleted?.(removed);
    this.emit();
  }

  clear(): void {
    this.notifications = [];
    this.emit();
  }

  markRead(id: string): void {
    this.notifications = this.notifications.map((item) => {
      if (item.id !== id) return item;
      this.analytics?.onNotificationRead?.(item);
      return { ...item, read: true, updatedAt: new Date().toISOString() };
    });
    this.emit();
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((item) => ({
      ...item,
      read: true,
      updatedAt: new Date().toISOString()
    }));
    this.emit();
  }

  subscribe(listener: (notifications: NotificationItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  unsubscribe(listener: (notifications: NotificationItem[]) => void): void {
    this.listeners.delete(listener);
  }

  async sync(): Promise<void> {
    if (!this.adapter?.sync) return;
    await this.adapter.sync(this.notifications);
  }

  async hydrate(): Promise<NotificationItem[]> {
    if (!this.adapter) return [];
    const fromApi = await this.adapter.fetchNotifications();
    this.notifications = fromApi;
    this.emit();
    return fromApi;
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.notifications));
  }
}
