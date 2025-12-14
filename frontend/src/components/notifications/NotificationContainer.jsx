import React, { useEffect } from "react";
import { useNotificationStore } from "../../state/notificationStore";
import { NotificationItem } from "./NotificationItem";

export const NotificationContainer = () => {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
};
