import type { NotificationFilter, NotificationItem } from "../types";

export const applyFilter = (
  notifications: NotificationItem[],
  filter: NotificationFilter
): NotificationItem[] => {
  return notifications.filter((item) => {
    if (filter.unread !== undefined && item.read === filter.unread) return false;
    if (filter.archived !== undefined && item.archived !== filter.archived) return false;
    if (filter.pinned !== undefined && item.pinned !== filter.pinned) return false;
    if (filter.starred !== undefined && item.starred !== filter.starred) return false;
    if (filter.category && item.category !== filter.category) return false;
    if (filter.senderId && item.sender?.id !== filter.senderId) return false;
    if (filter.priority && item.priority !== filter.priority) return false;
    if (filter.fromDate && item.timestamp < filter.fromDate) return false;
    if (filter.toDate && item.timestamp > filter.toDate) return false;
    if (filter.custom && !filter.custom(item)) return false;
    return true;
  });
};
