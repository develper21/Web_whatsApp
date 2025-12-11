import { ChatRoom } from "../models/ChatRoom.js";
import { Message } from "../models/Message.js";

export const createRoom = async (req, res) => {
  try {
    const { name, memberIds, isGroup = false } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ message: "memberIds must contain at least one user" });
    }

    const uniqueMemberIds = Array.from(new Set([...memberIds, req.user.id]));

    let room;
    let isExisting = false;
    if (!isGroup && uniqueMemberIds.length === 2) {
      room = await ChatRoom.findOne({
        isGroup: false,
        members: { $all: uniqueMemberIds, $size: 2 },
      });
      if (room) {
        isExisting = true;
      }
    }

    if (!room) {
      room = await ChatRoom.create({
        name: isGroup ? name : "",
        isGroup,
        members: uniqueMemberIds,
      });
    }

    await room.populate([
      { path: "members", select: "name email avatar onlineStatus lastSeen" },
      {
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      },
    ]);

    return res.status(isExisting ? 200 : 201).json(room);
  } catch (error) {
    console.error("createRoom error:", error);
    return res.status(500).json({ message: "Failed to create room" });
  }
};

export const listRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      members: req.user.id,
    })
      .populate("members", "name email avatar onlineStatus lastSeen")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      })
      .sort({ updatedAt: -1 });

    return res.json(rooms);
  } catch (error) {
    console.error("listRooms error:", error);
    return res.status(500).json({ message: "Failed to fetch rooms" });
  }
};
