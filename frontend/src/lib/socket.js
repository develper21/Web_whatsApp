import { io } from "socket.io-client";
import { useAuthStore } from "../state/authStore";
import { useChatStore } from "../state/chatStore";

let socket = null;

const setupListeners = () => {
  const { addMessage, setOnlineUsers, setTypingStatus, upsertRooms, addInvitation, updateInvitation } = useChatStore.getState();

  socket.on("receive-message", (message) => {
    addMessage(message.roomId, message);
  });

  socket.on("user-online", (payload) => {
    setOnlineUsers(payload);
  });

  socket.on("user-typing", ({ roomId, userId, isTyping }) => {
    setTypingStatus({ roomId, userId, isTyping });
  });

  socket.on("invitation:new", (invitation) => {
    addInvitation(invitation);
  });

  socket.on("invitation:updated", (invitation) => {
    updateInvitation(invitation);
  });

  socket.on("room:created", (room) => {
    upsertRooms(room);
  });
};

export const sendMessage = ({ roomId, content, attachments = [], clientMessageId }) => {
  if (!socket) return;
  socket.emit("send-message", { roomId, content, attachments, clientMessageId });
};

export const joinRoom = (roomId) => {
  if (!socket) return;
  socket.emit("join-room", roomId);
};

export const leaveRoom = (roomId) => {
  if (!socket) return;
  socket.emit("leave-room", roomId);
};

export const emitTyping = ({ roomId, isTyping }) => {
  if (!socket) return;
  socket.emit("typing", { roomId, isTyping });
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
