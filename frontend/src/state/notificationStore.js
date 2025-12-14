import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = uuidv4();
    const newNotification = {
      id,
      timestamp: Date.now(),
      autoHide: true,
      duration: 5000,
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    if (newNotification.autoHide) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  showSuccess: (message, options = {}) => {
    return get().addNotification({
      type: "success",
      message,
      ...options,
    });
  },

  showError: (message, options = {}) => {
    return get().addNotification({
      type: "error",
      message,
      autoHide: false,
      ...options,
    });
  },

  showWarning: (message, options = {}) => {
    return get().addNotification({
      type: "warning",
      message,
      duration: 6000,
      ...options,
    });
  },

  showInfo: (message, options = {}) => {
    return get().addNotification({
      type: "info",
      message,
      duration: 4000,
      ...options,
    });
  },
}));
