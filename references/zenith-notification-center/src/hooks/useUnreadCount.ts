import { useMemo } from "react";
import { useNotificationContext } from "../providers/NotificationProvider";

export const useUnreadCount = () => {
  const { notifications } = useNotificationContext();

  return useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
};
