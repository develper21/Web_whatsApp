import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "./chatStore";

const seed = () => {
  useChatStore.setState({
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
  });
};

describe("chatStore message lifecycle", () => {
  beforeEach(seed);

  it("stores pending then replaces with delivered when matching clientMessageId", () => {
    const roomId = "room-1";
    const pending = {
      clientMessageId: "client-123",
      content: "Hello",
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    useChatStore.getState().addPendingMessage(roomId, pending);
    const afterPending = useChatStore.getState();
    expect(afterPending.messages[roomId]).toHaveLength(1);
    expect(afterPending.messages[roomId][0].status).toBe("pending");
    expect(afterPending.pendingMessages[roomId][pending.clientMessageId]).toBeDefined();

    const delivered = {
      ...pending,
      _id: "server-1",
      sender: { _id: "user-1" },
      createdAt: pending.createdAt,
    };

    useChatStore.getState().addMessage(roomId, delivered);
    const afterDeliver = useChatStore.getState();
    expect(afterDeliver.messages[roomId]).toHaveLength(1);
    expect(afterDeliver.messages[roomId][0].status).toBe("delivered");
    expect(afterDeliver.messages[roomId][0]._id).toBe("server-1");
    expect(afterDeliver.pendingMessages[roomId]).toEqual({});
  });

  it("reset clears pending/messages", () => {
    useChatStore.getState().addPendingMessage("room-1", {
      clientMessageId: "x",
      content: "hi",
      createdAt: new Date().toISOString(),
    });
    useChatStore.getState().reset();
    const state = useChatStore.getState();
    expect(state.messages).toEqual({});
    expect(state.pendingMessages).toEqual({});
  });
});
