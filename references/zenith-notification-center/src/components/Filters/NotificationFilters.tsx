import type { ReactNode } from "react";
import type { NotificationFilter } from "../../types";

interface NotificationFiltersProps {
  value: NotificationFilter;
  onChange: (next: NotificationFilter) => void;
}

export const NotificationFiltersHeadless = ({
  value,
  onChange,
  children
}: NotificationFiltersProps & {
  children: (api: { value: NotificationFilter; onChange: (next: NotificationFilter) => void }) => ReactNode;
}) => <>{children({ value, onChange })}</>;

export const NotificationFilters = ({ value, onChange }: NotificationFiltersProps) => {
  return (
    <div className="znc-filters" role="group" aria-label="Notification filters">
      <button type="button" onClick={() => onChange({ ...value, unread: true })}>
        Unread
      </button>
      <button type="button" onClick={() => onChange({ ...value, archived: false })}>
        Active
      </button>
      <button type="button" onClick={() => onChange({})}>
        Reset
      </button>
    </div>
  );
};
