import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/token.js";
import { Message } from "../models/Message.js";
import { ChatRoom } from "../models/ChatRoom.js";

export const initSocket = (httpServer, clientOrigin = "http://localhost:5173") => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin.split(",").map((origin) => origin.trim()),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication token missing"));
      }
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    io.emit("user-online", { userId, status: "online" });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("typing", ({ roomId, isTyping }) => {
      socket.to(roomId).emit("user-typing", { roomId, userId, isTyping });
    });

    socket.on("send-message", async ({ roomId, content, attachments = [], clientMessageId }) => {
      try {
        const hasContent = content && content.trim().length > 0;
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
        if (!roomId || (!hasContent && !hasAttachments)) return;

        const message = await Message.create({
          roomId,
          sender: userId,
          content,
          attachments,
          readBy: [userId],
          clientMessageId,
        });

        await ChatRoom.findByIdAndUpdate(roomId, {
          latestMessage: message._id,
        });

        const populated = await message.populate("sender", "name email avatar");
        io.to(roomId).emit("receive-message", populated);
      } catch (error) {
        console.error("send-message error:", error);
      }
    });

    socket.on("disconnect", () => {
      io.emit("user-online", { userId, status: "offline" });
    });
  });

  return io;
};
