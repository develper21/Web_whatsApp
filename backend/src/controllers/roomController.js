import { ChatRoom } from "../models/ChatRoom.js";
import { Invitation } from "../models/Invitation.js";
import { emitToUser } from "../socket/index.js";

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
        admin: isGroup ? req.user.id : undefined,
        members: uniqueMemberIds,
      });
    }

    await room.populate([
      {
        path: "members",
        select: "name email avatar onlineStatus lastSeen encryptionPublicKey",
      },
      {
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      },
      { path: "admin", select: "name email avatar encryptionPublicKey" },
    ]);

    return res.status(isExisting ? 200 : 201).json(room);
  } catch (error) {
    console.error("createRoom error:", error);
    return res.status(500).json({ message: "Failed to create room" });
  }
};

export const inviteMembers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberIds } = req.body;
    const requesterId = req.user.id;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds must be a non-empty array" });
    }

    const room = await ChatRoom.findById(roomId)
      .populate(
        "members",
        "name email avatar onlineStatus lastSeen encryptionPublicKey"
      )
      .populate("admin", "name email avatar encryptionPublicKey");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isGroup) {
      return res.status(400).json({ message: "Only group rooms support invitations" });
    }

    if (!room.admin || room.admin._id.toString() !== requesterId) {
      return res.status(403).json({ message: "Only the group admin can invite members" });
    }

    const existingMemberIds = new Set(room.members.map((member) => member._id.toString()));
    const uniqueTargets = [...new Set(memberIds.map((id) => id.toString()))]
      .filter((id) => id !== requesterId && !existingMemberIds.has(id));

    if (uniqueTargets.length === 0) {
      return res.json(room);
    }

    for (const memberId of uniqueTargets) {
      try {
        const invitation = await Invitation.create({
          sender: requesterId,
          recipient: memberId,
          type: "group",
          room: room._id,
          roomName: room.name || "",
          message: room.name
            ? `You've been invited to join ${room.name} on AlgoChat`
            : "You've been invited to join a group chat on AlgoChat",
        });

        await invitation.populate("sender", "name email avatar");

        const payload = invitation.toObject({ virtuals: true });
        emitToUser(memberId, "invitation:new", payload);
        emitToUser(requesterId, "invitation:sent", payload);
      } catch (error) {
        if (error.code === 11000) {
          // Existing pending invitation, skip creating a duplicate
          continue;
        }
        throw error;
      }
    }

    return res.json(room);
  } catch (error) {
    console.error("inviteMembers error:", error);
    return res.status(500).json({ message: "Failed to invite members" });
  }
};

export const createRoomForInvitation = async (memberIds, isGroup = false, roomId = null) => {
  try {
    let room;

    if (isGroup && roomId) {
      room = await ChatRoom.findById(roomId);
      if (!room) {
        throw new Error("Group room referenced by invitation was not found");
      }

      const uniqueMemberIds = new Set(room.members.map((member) => member.toString()));
      memberIds.forEach((id) => uniqueMemberIds.add(id));

      room.members = Array.from(uniqueMemberIds);
      await room.save();
    } else {
      const uniqueMemberIds = Array.from(new Set(memberIds));

      room = await ChatRoom.findOne({
        isGroup: false,
        members: { $all: uniqueMemberIds, $size: 2 },
      });

      if (!room) {
        room = await ChatRoom.create({
          name: "",
          isGroup: false,
          members: uniqueMemberIds,
        });
      }
    }

    await room.populate([
      {
        path: "members",
        select: "name email avatar onlineStatus lastSeen encryptionPublicKey",
      },
      { path: "admin", select: "name email avatar encryptionPublicKey" },
    ]);

    return room;
  } catch (error) {
    console.error("createRoomForInvitation error:", error);
    throw error;
  }
};

export const listRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      members: req.user.id,
    })
      .populate(
        "members",
        "name email avatar onlineStatus lastSeen encryptionPublicKey"
      )
      .populate("admin", "name email avatar encryptionPublicKey")
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
