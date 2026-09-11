import type { ReactNode } from "react";

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "primary"
  | "secondary"
  | "system"
  | "chat"
  | "mention"
  | "reminder"
  | "calendar"
  | "meeting"
  | "task"
  | "upload"
  | "download"
  | "security"
  | "approval"
  | "marketing"
  | "announcement"
  | "custom";

export type NotificationPriority = "critical" | "high" | "medium" | "low" | "silent";

export type NotificationStatus = "new" | "delivered" | "failed" | "queued";

export interface NotificationButton {
  id: string;
  label: string;
  action: string;
  variant?: "primary" | "secondary" | "danger";
}

export interface NotificationAttachment {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface NotificationSender {
  id: string;
  name: string;
  avatar?: string;
}

export interface NotificationActionPayload {
  id: string;
  read?: boolean;
  archived?: boolean;
  pinned?: boolean;
  starred?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  description?: string;
  icon?: string;
  image?: string;
  avatar?: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  type: NotificationType;
  category: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  read: boolean;
  archived: boolean;
  starred: boolean;
  pinned: boolean;
  actionUrl?: string;
  buttons?: NotificationButton[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  sender?: NotificationSender;
  groupId?: string;
  expiresAt?: string;
  progress?: number;
  attachments?: NotificationAttachment[];
  sound?: string;
  vibration?: number[];
  deliveryStatus?: "pending" | "sent" | "received" | "failed";
  isOffline?: boolean;
  retryCount?: number;
  customData?: Record<string, unknown>;
}

export interface NotificationFilter {
  unread?: boolean;
  archived?: boolean;
  pinned?: boolean;
  starred?: boolean;
  category?: string;
  senderId?: string;
  priority?: NotificationPriority;
  fromDate?: number;
  toDate?: number;
  custom?: (item: NotificationItem) => boolean;
}

export type NotificationSort =
  | "newest"
  | "oldest"
  | "priority"
  | "unread-first"
  | "alphabetical"
  | "sender"
  | "category";

export type NotificationGroupBy =
  | "none"
  | "sender"
  | "application"
  | "date"
  | "category"
  | "priority"
  | "thread"
  | "conversation"
  | "project"
  | "workspace"
  | ((item: NotificationItem) => string);

export interface NotificationGroup {
  id: string;
  title: string;
  unreadCount: number;
  notifications: NotificationItem[];
}

export interface NotificationAdapter {
  fetchNotifications: () => Promise<NotificationItem[]>;
  sendNotification?: (input: Partial<NotificationItem>) => Promise<NotificationItem>;
  markRead?: (id: string) => Promise<void>;
  delete?: (id: string) => Promise<void>;
  archive?: (id: string) => Promise<void>;
  sync?: (items: NotificationItem[]) => Promise<void>;
}

export interface RealtimeAdapter {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (listener: (notification: NotificationItem) => void) => () => void;
  status?: () => "connected" | "connecting" | "disconnected";
}

export interface NotificationAnalyticsEvents {
  onNotificationReceived?: (item: NotificationItem) => void;
  onNotificationOpened?: (item: NotificationItem) => void;
  onNotificationRead?: (item: NotificationItem) => void;
  onNotificationDeleted?: (item: NotificationItem) => void;
  onToastShown?: (item: NotificationItem) => void;
  onToastClosed?: (item: NotificationItem) => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export interface NotificationTheme {
  name: string;
  mode: "light" | "dark" | "auto";
  radius: string;
  fontFamily: string;
  spacing: string;
  colors: {
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    badge: string;
  };
}

export interface NotificationProviderProps {
  children: ReactNode;
  initialNotifications?: NotificationItem[];
  adapter?: NotificationAdapter;
  realtime?: RealtimeAdapter;
  analytics?: NotificationAnalyticsEvents;
  storageKey?: string;
  offlineEnabled?: boolean;
  maxNotifications?: number;
  theme?: Partial<NotificationTheme>;
}

export interface NotificationState {
  notifications: NotificationItem[];
  selectedIds: string[];
  searchQuery: string;
  filters: NotificationFilter;
  groupBy: NotificationGroupBy;
  sortBy: NotificationSort;
  isOnline: boolean;
  permission: NotificationPermission | "unsupported";
}

export interface ToastOptions {
  id?: string;
  type?: NotificationType;
  title: string;
  message?: string;
  description?: string;
  duration?: number;
  persistent?: boolean;
  position?: ToastPosition;
  actionLabel?: string;
  onAction?: () => void;
  metadata?: Record<string, unknown>;
}

export type ToastPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center"
  | "custom";

export interface NotificationContextValue extends NotificationState {
  add: (input: Partial<NotificationItem>) => NotificationItem;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<NotificationItem>) => void;
  archive: (id: string) => void;
  pin: (id: string, pinned?: boolean) => void;
  star: (id: string, starred?: boolean) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  search: (query: string) => void;
  filter: (filter: NotificationFilter) => void;
  group: (groupBy: NotificationGroupBy) => void;
  sort: (sortBy: NotificationSort) => void;
  sync: () => Promise<void>;
  subscribe: (listener: (items: NotificationItem[]) => void) => () => void;
  unsubscribe: (listener: (items: NotificationItem[]) => void) => void;
  toasts: NotificationItem[];
  toast: {
    show: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    promise: <T>(promise: Promise<T>, options: {
      loading: ToastOptions;
      success: (value: T) => ToastOptions;
      error: (error: unknown) => ToastOptions;
    }) => Promise<T>;
  };
}
