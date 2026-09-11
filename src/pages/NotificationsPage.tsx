import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../features/notifications/service';
import type { CampusNotification, NotificationFilters, NotificationType } from '../features/notifications/models';
import './AccountPages.css';

const labels: Record<NotificationType, string> = { assignment_deadline: 'Assignment', examination_reminder: 'Examination', lecture_reminder: 'Lecture', attendance_alert: 'Attendance', missed_study_session: 'Study Planner', new_notice: 'Notice Intelligence', atkt_update: 'ATKT' };
const types = Object.keys(labels) as NotificationType[];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<CampusNotification[]>([]);
  const [filters, setFilters] = useState<NotificationFilters>({ status: 'all' });
  const [loading, setLoading] = useState(true);
  const fetchInbox = useCallback(() => notificationService.getInbox(), []);
  const refresh = useCallback(async () => { setNotifications(await fetchInbox()); setLoading(false); }, [fetchInbox]);
  useEffect(() => {
    const apply = (values: CampusNotification[]) => { setNotifications(values); setLoading(false); };
    void fetchInbox().then(apply); return notificationService.subscribe(() => void fetchInbox().then(apply));
  }, [fetchInbox]);
  const visible = useMemo(() => notificationService.filter(notifications, filters), [notifications, filters]);
  const unread = notificationService.unreadCount(notifications);

  return <section className="account-page"><header><h1>Notifications</h1><p>{unread} unread notification{unread === 1 ? '' : 's'}</p></header>
    <div className="account-toolbar" role="group" aria-label="Read-status filter">{(['all', 'unread', 'read'] as const).map((status) => <button className={filters.status === status ? 'active' : ''} key={status} onClick={() => setFilters({ ...filters, status })}>{status[0].toUpperCase() + status.slice(1)}</button>)}</div>
    <div className="account-toolbar"><label>Notification type<select value={filters.type ?? ''} onChange={(event) => setFilters({ ...filters, type: event.target.value as NotificationType || undefined })}><option value="">All types</option>{types.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label><button onClick={() => setFilters({ status: 'all' })}>Clear filters</button><button disabled={unread === 0} onClick={() => void notificationService.markAllRead(notifications).then(refresh)}>Mark all as read</button></div>
    {loading ? <p>Loading notifications…</p> : visible.length === 0 ? <p className="account-empty">No notifications match the current filters.</p> : <div className="notification-list">{visible.map((notification) => <article key={notification.id} className={notification.status}><div><span className={`priority ${notification.priority}`}>{notification.priority}</span><small>{labels[notification.type]} · {new Date(notification.createdAt).toLocaleString()}</small><h2>{notification.title}</h2><p>{notification.message}</p></div><div className="account-actions"><Link to={notification.relatedPath} onClick={() => void notificationService.markRead(notification.stableSourceKey)}>Open source</Link>{notification.status === 'unread' && <button onClick={() => void notificationService.markRead(notification.stableSourceKey).then(refresh)}>Mark read</button>}<button className="danger" onClick={() => void notificationService.dismiss(notification.stableSourceKey).then(refresh)}>Dismiss</button></div></article>)}</div>}
  </section>;
}
