import { Message } from "../models/Message.js";
import { ChatRoom } from "../models/ChatRoom.js";

export const fetchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const isMember = await ChatRoom.exists({
      _id: roomId,
      members: req.user.id,
    });

    if (!isMember) {
      return res.status(403).json({ message: "You are not part of this room" });
    }

    const messages = await Message.find({ roomId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error("fetchMessages error:", error);
    return res.status(500).json({ message: "Failed to load messages" });
  }
};
