import type { ReactNode } from "react";
import { useNotificationCenter } from "../../hooks/useNotificationCenter";
import { NotificationFilters } from "../Filters/NotificationFilters";
import { NotificationList } from "../NotificationList/NotificationList";
import { NotificationSearch } from "../Search/NotificationSearch";
import { EmptyState } from "../EmptyState/EmptyState";

export const NotificationInboxHeadless = ({
  children
}: {
  children: (api: ReturnType<typeof useNotificationCenter>) => ReactNode;
}) => {
  const api = useNotificationCenter();
  return <>{children(api)}</>;
};

export const NotificationInbox = () => {
  const {
    notifications,
    searchQuery,
    search,
    filters,
    filter,
    markRead,
    archive,
    star,
    markAllRead,
    clear
  } = useNotificationCenter();

  return (
    <section className="znc-inbox" aria-label="Notification inbox">
      <header className="znc-inbox-header">
        <h3>Notification Center</h3>
        <div>
          <button type="button" onClick={markAllRead}>
            Mark all read
          </button>
          <button type="button" onClick={clear}>
            Clear all
          </button>
        </div>
      </header>
      <div className="znc-toolbar">
        <NotificationSearch value={searchQuery} onChange={search} />
        <NotificationFilters value={filters} onChange={filter} />
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="All clear" description="No notifications match your current filters." />
      ) : (
        <NotificationList items={notifications} onRead={markRead} onArchive={archive} onStar={star} />
      )}
    </section>
  );
};
