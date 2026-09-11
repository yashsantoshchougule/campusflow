export type NotificationType = 'assignment_deadline' | 'examination_reminder' | 'lecture_reminder' | 'attendance_alert' | 'missed_study_session' | 'new_notice' | 'atkt_update';
export type NotificationStatus = 'unread' | 'read' | 'dismissed';
export type NotificationPriority = 'normal' | 'important' | 'urgent';

export interface CampusNotification {
  id: string;
  stableSourceKey: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  createdAt: string;
  relatedEntityType: string;
  relatedEntityId: string;
  relatedPath: string;
  status: NotificationStatus;
  readAt?: string;
  dismissedAt?: string;
}

export interface NotificationStateRecord { stableSourceKey: string; status: NotificationStatus; readAt?: string; dismissedAt?: string }
export interface NotificationFilters { type?: NotificationType; status?: 'all' | 'unread' | 'read' }
export interface NotificationPreferences {
  enabled: boolean;
  assignmentReminderHours: number;
  examReminderDays: number;
  lectureReminderMinutes: number;
  attendanceAlerts: boolean;
  noticeAlerts: boolean;
  atktAlerts: boolean;
  updatedAt: string;
}

