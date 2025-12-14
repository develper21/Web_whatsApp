import { useNotificationStore } from "../state/notificationStore";

export const notificationService = {
  success: (message, options = {}) => {
    return useNotificationStore.getState().showSuccess(message, options);
  },

  error: (message, options = {}) => {
    return useNotificationStore.getState().showError(message, options);
  },

  warning: (message, options = {}) => {
    return useNotificationStore.getState().showWarning(message, options);
  },

  info: (message, options = {}) => {
    return useNotificationStore.getState().showInfo(message, options);
  },

  userEvents: {
    signup: (userName) => {
      return notificationService.success(
        `Welcome to AlgoChat, ${userName}!`,
        { description: "Your account has been created successfully." }
      );
    },

    login: (userName) => {
      return notificationService.success(
        `Welcome back, ${userName}!`,
        { description: "You have logged in successfully." }
      );
    },

    logout: () => {
      return notificationService.info(
        "Logged out successfully",
        { description: "You have been logged out of your account." }
      );
    },

    profileUpdate: () => {
      return notificationService.success(
        "Profile updated successfully",
        { description: "Your profile changes have been saved." }
      );
    },
  },

  chatEvents: {
    groupCreated: (groupName, isDirect = false) => {
      return notificationService.success(
        `${isDirect ? 'Chat' : `Group "${groupName}"`} created successfully!`,
        { description: isDirect 
          ? "You can now start chatting with this user." 
          : "You can now invite members to join the group."
        }
      );
    },

    invitationSent: (recipientName, groupName) => {
      return notificationService.success(
        "Invitation sent successfully!",
        { description: `You have invited ${recipientName} to join "${groupName}".` }
      );
    },

    invitationAccepted: (groupName) => {
      return notificationService.success(
        "Invitation accepted!",
        { description: `You have joined "${groupName}" successfully.` }
      );
    },

    invitationDeclined: () => {
      return notificationService.info(
        "Invitation declined",
        { description: "You have declined the group invitation." }
      );
    },

    messageSent: () => {
      return notificationService.info(
        "Message sent",
        { description: "Your message has been delivered.", duration: 2000 }
      );
    },

    messageFailed: () => {
      return notificationService.error(
        "Message failed to send",
        { description: "Please check your connection and try again." }
      );
    },

    userJoinedGroup: (userName, groupName) => {
      return notificationService.info(
        `${userName} joined the group`,
        { description: `${userName} has joined "${groupName}".` }
      );
    },

    userLeftGroup: (userName, groupName) => {
      return notificationService.warning(
        `${userName} left the group`,
        { description: `${userName} has left "${groupName}".` }
      );
    },
  },

  errorEvents: {
    networkError: () => {
      return notificationService.error(
        "Network error",
        { description: "Please check your internet connection and try again." }
      );
    },

    serverError: () => {
      return notificationService.error(
        "Server error",
        { description: "Something went wrong on our end. Please try again later." }
      );
    },

    unauthorized: () => {
      return notificationService.error(
        "Authentication required",
        { description: "Please log in to continue." }
      );
    },

    forbidden: () => {
      return notificationService.error(
        "Access denied",
        { description: "You don't have permission to perform this action." }
      );
    },

    notFound: () => {
      return notificationService.warning(
        "Not found",
        { description: "The requested resource was not found." }
      );
    },
  },
};
