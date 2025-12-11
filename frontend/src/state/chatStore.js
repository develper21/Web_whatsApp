import { create } from "zustand";
import api from "../lib/apiClient";

const upsertRooms = (rooms, newRoom) => {
  const exists = rooms.find((room) => room._id === newRoom._id);
  if (exists) {
    return rooms.map((room) => (room._id === newRoom._id ? { ...room, ...newRoom } : room));
  }
  return [newRoom, ...rooms];
};

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
      throw error;
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
      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: data,
        },
        loadingMessages: false,
      }));
      return data;
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
      return data;
    } catch (error) {
      set({ roomActionLoading: false });
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
    }),
}));

