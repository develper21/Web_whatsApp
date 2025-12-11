import { io } from "socket.io-client";
import { useAuthStore } from "../state/authStore";
import { useChatStore } from "../state/chatStore";

let socket = null;

const setupListeners = () => {
  const { addMessage, setOnlineUsers, setTypingStatus } = useChatStore.getState();

  socket.on("receive-message", (message) => {
    addMessage(message.roomId, message);
  });

  socket.on("user-online", (payload) => {
    setOnlineUsers(payload);
  });

  socket.on("user-typing", ({ roomId, userId, isTyping }) => {
    setTypingStatus({ roomId, userId, isTyping });
  });
};

export const initSocket = () => {
  const token = useAuthStore.getState().accessToken;
  if (!token || socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
    auth: { token },
  });

  setupListeners();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
