import { io } from "socket.io-client";
import { useAuthStore } from "../state/authStore";
import { useChatStore } from "../state/chatStore";
import {
  base64ToArrayBuffer,
  decodeText,
  importPrivateKey,
  decryptMessage,
} from "./cryptoUtils";

let socket = null;

const setupListeners = () => {
  const { addMessage, setOnlineUsers, setTypingStatus, upsertRooms, addInvitation, updateInvitation } = useChatStore.getState();

  socket.on("receive-message", (message) => {
    handleIncomingMessage(message).then((processedMessage) => {
      addMessage(message.roomId, processedMessage);
    });
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

const decryptMessageContent = async ({ message, privateKeyBase64 }) => {
  if (!privateKeyBase64) return message.content;
  const encryption = message.encryption;
  if (!encryption || !encryption.recipients || !Array.isArray(encryption.recipients)) {
    return message.content;
  }

  const recipientEntry = encryption.recipients.find((entry) => entry.userId === message.targetUserId);
  if (!recipientEntry?.encryptedKey) {
    return message.content;
  }

  try {
    const privateKey = await importPrivateKey(privateKeyBase64);
    const encryptedKeyBuffer = base64ToArrayBuffer(recipientEntry.encryptedKey);
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBuffer
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const ivBuffer = base64ToArrayBuffer(encryption.iv);
    const ciphertextBuffer = base64ToArrayBuffer(message.content);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(ivBuffer),
      },
      aesKey,
      ciphertextBuffer
    );

    return decodeText(decryptedBuffer);
  } catch (error) {
    console.error("Failed to decrypt message", error);
    return message.content;
  }
};

const handleIncomingMessage = async (message) => {
  try {
    const authState = useAuthStore.getState();
    const privateKeyBase64 = authState.encryptionPrivateKey;
    const currentUserId = authState.user?._id;

    if (!currentUserId || !privateKeyBase64) {
      return message;
    }

    const augmentedMessage = { ...message, targetUserId: currentUserId };
    const decryptedResult = await decryptMessage({
      message: augmentedMessage,
      privateKeyBase64,
      userId: currentUserId,
    });

    if (!decryptedResult) {
      return message;
    }

    const { content, session } = decryptedResult;
    const processedAttachments = await Promise.all(
      (message.attachments || []).map(async (attachment) => {
        if (!attachment?.encryption || !session) {
          return attachment;
        }
        try {
          const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv: new Uint8Array(base64ToArrayBuffer(attachment.encryption.iv)),
            },
            session.aesKey,
            await (await fetch(attachment.url)).arrayBuffer()
          );
          const blob = new Blob([decryptedBuffer], { type: attachment.originalType || attachment.type });
          const objectUrl = URL.createObjectURL(blob);
          return {
            ...attachment,
            objectUrl,
          };
        } catch (error) {
          console.error("Failed to decrypt attachment", error);
          return attachment;
        }
      })
    );

    return {
      ...message,
      content,
      attachments: processedAttachments,
      session,
    };
  } catch (error) {
    console.error("Failed to process incoming message", error);
    return message;
  }
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
