import { create } from "zustand";
import api from "../lib/apiClient";
import { useAuthStore } from "./authStore";
import { encryptMessageForRecipients, decryptMessageForUser, decryptMessage, base64ToArrayBuffer } from "../lib/cryptoUtils";
import { useNotificationStore } from "./notificationStore";

const upsertRooms = (rooms, newRoom) => {
  const exists = rooms.find((room) => room._id === newRoom._id);
  if (exists) {
    return rooms.map((room) => (room._id === newRoom._id ? { ...room, ...newRoom } : room));
  }
  return [newRoom, ...rooms];
};

const UNABLE_TO_DECRYPT_PLACEHOLDER = "[Unable to decrypt message]";

export const useChatStore = create((set, get) => ({
  rooms: [],
  selectedRoomId: null,
  messages: {},
  loadingRooms: false,
  loadingMessages: false,
  onlineUsers: new Set(),
  typingStatus: {},
  userSearchResults: [],
  searchingUsers: false,
  roomActionLoading: false,
  pendingMessages: {},
  invitations: [],
  loadingInvitations: false,
  sentInvitations: [],
  contacts: [],
  loadingContacts: false,

  setOnlineUsers: (payload) => {
    set((state) => {
      const next = new Set(state.onlineUsers);
      if (Array.isArray(payload)) {
        return { onlineUsers: new Set(payload) };
      }
      if (payload?.status === "online") {
        next.add(payload.userId);
      } else if (payload?.status === "offline") {
        next.delete(payload.userId);
      }
      return { onlineUsers: next };
    });
  },

  setTypingStatus: ({ roomId, userId, isTyping }) =>
    set((state) => {
      const updated = { ...state.typingStatus };
      updated[roomId] = {
        ...(updated[roomId] || {}),
        [userId]: isTyping,
      };
      return { typingStatus: updated };
    }),

  fetchRooms: async () => {
    set({ loadingRooms: true });
    try {
      const { data } = await api.get("/rooms");
      set({ rooms: data, loadingRooms: false });
      return data;
    } catch (error) {
      set({ loadingRooms: false });
      console.error("Failed to fetch rooms:", error);
      return [];
    }
  },

  selectRoom: async (roomId) => {
    set({ selectedRoomId: roomId });
    const hasMessages = get().messages[roomId];
    if (!hasMessages && roomId) {
      await get().fetchMessages(roomId);
    }
  },

  fetchMessages: async (roomId) => {
    if (!roomId) return;
    set({ loadingMessages: true });
    try {
      const { data } = await api.get(`/messages/${roomId}`);
      const authState = useAuthStore.getState();
      const privateKeyBase64 = authState.encryptionPrivateKey;
      const currentUserId = authState.user?._id;

      const processedMessages = await Promise.all(
        (data || []).map(async (message) => {
          if (!message?.encryption) {
            return message;
          }

          if (!privateKeyBase64 || !currentUserId) {
            return {
              ...message,
              content: UNABLE_TO_DECRYPT_PLACEHOLDER,
            };
          }

          const decryptedResult = await decryptMessage({
            message,
            privateKeyBase64,
            userId: currentUserId,
          });

          if (decryptedResult) {
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
          }

          return {
            ...message,
            content: UNABLE_TO_DECRYPT_PLACEHOLDER,
          };
        })
      );

      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: processedMessages,
        },
        loadingMessages: false,
      }));
      return processedMessages;
    } catch (error) {
      set({ loadingMessages: false });
      throw error;
    }
  },

  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (() => {
          const existing = state.messages[roomId] || [];
          if (message.clientMessageId) {
            const idx = existing.findIndex(
              (m) => m.clientMessageId && m.clientMessageId === message.clientMessageId
            );
            if (idx !== -1) {
              const replaced = [...existing];
              replaced[idx] = { ...message, status: "delivered" };
              return replaced;
            }
          }
          return [...existing, { ...message, status: "delivered" }];
        })(),
      },
      rooms: state.rooms.map((room) =>
        room._id === roomId ? { ...room, latestMessage: message, updatedAt: message.createdAt } : room
      ),
      pendingMessages: (() => {
        const next = { ...state.pendingMessages };
        if (message.clientMessageId && next[roomId]) {
          delete next[roomId][message.clientMessageId];
        }
        return next;
      })(),
    })),

  addPendingMessage: (roomId, message) =>
    set((state) => {
      const pendingForRoom = state.pendingMessages[roomId] || {};
      return {
        pendingMessages: {
          ...state.pendingMessages,
          [roomId]: {
            ...pendingForRoom,
            [message.clientMessageId]: message,
          },
        },
        messages: {
          ...state.messages,
          [roomId]: [...(state.messages[roomId] || []), { ...message, status: "pending" }],
        },
      };
    }),

  searchUsers: async (query) => {
    if (!query) {
      set({ userSearchResults: [] });
      return [];
    }
    set({ searchingUsers: true });
    try {
      const { data } = await api.get("/users", { params: { q: query } });
      set({ userSearchResults: data, searchingUsers: false });
      return data;
    } catch (error) {
      set({ searchingUsers: false });
      throw error;
    }
  },

  clearUserSearch: () => set({ userSearchResults: [] }),

  createRoom: async (payload) => {
    set({ roomActionLoading: true });
    try {
      const { data } = await api.post("/rooms", payload);
      set((state) => ({
        rooms: upsertRooms(state.rooms, data),
        roomActionLoading: false,
      }));
      
      useNotificationStore.getState().showSuccess(
        payload.isGroup ? `Group "${data.name}" created successfully!` : "Chat started successfully!",
        { description: payload.isGroup 
          ? "You can now invite members to join the group." 
          : "You can now start chatting with this user."
        }
      );
      
      return data;
    } catch (error) {
      set({ roomActionLoading: false });
      
      useNotificationStore.getState().showError(
        payload.isGroup ? "Failed to create group" : "Failed to start chat",
        { description: error.response?.data?.message || "Please try again later." }
      );
      
      throw error;
    }
  },

  fetchInvitations: async () => {
    set({ loadingInvitations: true });
    try {
      const { data } = await api.get("/invitations");
      set({ invitations: data, loadingInvitations: false });
      return data;
    } catch (error) {
      set({ loadingInvitations: false });
      console.error("Failed to fetch invitations:", error);
      return [];
    }
  },

  fetchContacts: async (query = "") => {
    set({ loadingContacts: true });
    try {
      const params = query ? { q: query } : undefined;
      const { data } = await api.get("/users", { params });
      set({ contacts: data, loadingContacts: false });
      return data;
    } catch (error) {
      set({ loadingContacts: false });
      console.error("Failed to fetch contacts:", error);
      useNotificationStore.getState().showError(
        "Unable to load contacts",
        { description: error.response?.data?.message || "Please try again later." }
      );
      throw error;
    }
  },

  addInvitation: (invitation) =>
    set((state) => ({
      invitations: [invitation, ...state.invitations.filter((inv) => inv._id !== invitation._id)],
    })),

  addSentInvitation: (invitation) =>
    set((state) => ({
      sentInvitations: [invitation, ...state.sentInvitations.filter((inv) => inv._id !== invitation._id)],
    })),

  updateInvitation: (invitation) =>
    set((state) => {
      const shouldUpdateIncoming = state.invitations.some((inv) => inv._id === invitation._id);
      const shouldUpdateOutgoing = state.sentInvitations.some((inv) => inv._id === invitation._id);

      return {
        invitations: shouldUpdateIncoming
          ? (invitation.status === "pending"
              ? state.invitations.map((inv) => (inv._id === invitation._id ? invitation : inv))
              : state.invitations.filter((inv) => inv._id !== invitation._id))
          : state.invitations,
        sentInvitations: shouldUpdateOutgoing
          ? (invitation.status === "pending"
              ? state.sentInvitations.map((inv) => (inv._id === invitation._id ? invitation : inv))
              : state.sentInvitations.filter((inv) => inv._id !== invitation._id))
          : state.sentInvitations,
      };
    }),

  sendInvitation: async ({ recipientEmail, message, type = "direct", roomId, roomName, recipientProfile }) => {
    try {
      const payload = { recipientEmail, message, type, roomId, roomName };
      const { data } = await api.post("/invitations", payload);
      if (data?.invitation) {
        const invitation = data.invitation;
        const recipientData = (() => {
          if (invitation.recipient && typeof invitation.recipient === "object") {
            return invitation.recipient;
          }
          if (recipientProfile && recipientProfile._id) {
            return { ...recipientProfile };
          }
          if (invitation.recipient) {
            return { _id: invitation.recipient };
          }
          return undefined;
        })();

        const enrichedInvitation = recipientData
          ? { ...invitation, recipient: recipientData }
          : invitation;

        set((state) => ({
          sentInvitations: [enrichedInvitation, ...state.sentInvitations.filter((inv) => inv._id !== enrichedInvitation._id)],
        }));
      }

      useNotificationStore.getState().showSuccess(
        "Invitation sent",
        { description: `Invitation has been sent to ${recipientEmail}.` }
      );

      return data?.invitation;
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        useNotificationStore.getState().showError(
          "User not found",
          { description: "No user exists with that email." }
        );
      } else if (status === 409) {
        useNotificationStore.getState().showInfo(
          "Invitation already pending",
          { description: error.response?.data?.message || "You have already invited this user." }
        );
      } else {
        useNotificationStore.getState().showError(
          "Failed to send invitation",
          { description: error.response?.data?.message || "Please try again." }
        );
      }
      throw error;
    }
  },

  upsertRooms: (newRoom) =>
    set((state) => ({
      rooms: upsertRooms(state.rooms, newRoom),
    })),

  respondToInvitation: async (invitationId, status) => {
    try {
      const { data } = await api.patch(`/invitations/${invitationId}/respond`, { status });
      set((state) => ({
        invitations: state.invitations.filter(inv => inv._id !== invitationId),
      }));
      
      if (status === "accepted") {
        await get().fetchRooms();
        useNotificationStore.getState().showSuccess(
          "Invitation accepted!",
          { description: "You have joined the chat successfully." }
        );
      } else {
        useNotificationStore.getState().showInfo(
          "Invitation declined",
          { description: "You have declined the chat invitation." }
        );
      }
      
      return data;
    } catch (error) {
      useNotificationStore.getState().showError(
        "Failed to respond to invitation",
        { description: error.response?.data?.message || "Please try again." }
      );
      throw error;
    }
  },

  // New function to invite members to a group
  inviteMembers: async (roomId, memberIds) => {
    try {
      const { data } = await api.post(`/rooms/${roomId}/invite`, { memberIds });
      set((state) => ({
        rooms: state.rooms.map(room => 
          room._id === roomId ? data : room
        ),
      }));
      
      useNotificationStore.getState().showSuccess(
        "Members invited successfully!",
        { description: "The selected members have been invited to join the group." }
      );
      
      return data;
    } catch (error) {
      useNotificationStore.getState().showError(
        "Failed to invite members",
        { description: error.response?.data?.message || "Please try again." }
      );
      throw error;
    }
  },

  reset: () =>
    set({
      rooms: [],
      selectedRoomId: null,
      messages: {},
      loadingRooms: false,
      loadingMessages: false,
      onlineUsers: new Set(),
      typingStatus: {},
      userSearchResults: [],
      searchingUsers: false,
      roomActionLoading: false,
      pendingMessages: {},
      invitations: [],
      loadingInvitations: false,
      sentInvitations: [],
      contacts: [],
      loadingContacts: false,
    }),
}));