import React, { useState, useEffect } from "react";
import { useNotificationStore } from "../../state/notificationStore";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const notificationStyles = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: XCircle,
    iconColor: "text-red-600",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-600",
  },
};

export const NotificationItem = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { removeNotification } = useNotificationStore();

  const style = notificationStyles[notification.type] || notificationStyles.info;
  const Icon = style.icon;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  return (
    <div
      className={`
        ${style.bg} ${style.border} ${style.text}
        border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95"
        }
        ${isLeaving 
          ? "translate-x-full opacity-0 scale-95" 
          : ""
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
            {notification.description && (
              <p className="text-xs mt-1 opacity-75">{notification.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleClose}
          className={`ml-3 ${style.iconColor} hover:opacity-75 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
