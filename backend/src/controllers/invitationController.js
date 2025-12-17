import { Invitation } from "../models/Invitation.js";
import { User } from "../models/User.js";
import { emitNotification, emitToUser } from "../socket/index.js";
import { createRoomForInvitation } from "./roomController.js";

export const sendInvitation = async (req, res) => {
  try {
    const {
      recipientEmail,
      message,
      type = "direct",
      roomId,
      roomName,
    } = req.body;
    const senderId = req.user.id;

    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    // Find recipient user
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    if (recipient._id.toString() === senderId) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    // Check for existing invitation (either direction)
    const existingInvitation = await Invitation.findOne({
      $or: [
        { sender: senderId, recipient: recipient._id },
        { sender: recipient._id, recipient: senderId }
      ]
    });

    if (existingInvitation) {
      if (existingInvitation.status === "pending") {
        return res.status(409).json({ message: "Invitation already sent" });
      } else if (existingInvitation.status === "accepted") {
        return res.status(409).json({ message: "You already have a chat with this user" });
      } else {
        // Rejected invitation - allow sending new one
        await Invitation.findByIdAndDelete(existingInvitation._id);
      }
    }

    const invitationPayload = {
      sender: senderId,
      recipient: recipient._id,
      message: message || "Let's connect on AlgoChat!",
      type,
    };

    if (type === "group" && roomId) {
      invitationPayload.room = roomId;
    }

    if (type === "group" && roomName) {
      invitationPayload.roomName = roomName;
    }

    // Create new invitation
    const invitation = await Invitation.create(invitationPayload);

    // Populate sender details for response
    await invitation.populate("sender", "name email avatar");
    const invitationData = invitation.toObject({ virtuals: true });

    emitToUser(recipient._id.toString(), "invitation:new", invitationData);
    emitToUser(senderId, "invitation:sent", invitationData);

    const senderName = invitationData.sender?.name || "Someone";
    const inviteContext =
      type === "group" && (roomName || invitationData.roomName)
        ? `the group "${roomName || invitationData.roomName}"`
        : "a chat";

    emitNotification(recipient._id.toString(), {
      type: "info",
      message: "New chat invitation",
      description: `${senderName} invited you to join ${inviteContext}.`,
    });

    emitNotification(senderId, {
      type: "success",
      message: "Invitation sent",
      description: `Waiting for ${recipient.name || "the recipient"} to respond.`,
    });

    return res.status(201).json({
      message: "Invitation sent successfully",
      invitation: invitationData,
    });
  } catch (error) {
    console.error("sendInvitation error:", error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ message: "Invitation already exists" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get invitations where user is recipient and status is pending
    const invitations = await Invitation.find({
      recipient: userId,
      status: "pending",
    })
    .populate("sender", "name email avatar")
    .sort({ createdAt: -1 });

    return res.json(invitations);
  } catch (error) {
    console.error("getInvitations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status } = req.body; // "accepted" or "rejected"
    const userId = req.user.id;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const invitation = await Invitation.findOne({
      _id: invitationId,
      recipient: userId,
      status: "pending",
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    invitation.status = status;
    invitation.respondedAt = new Date();
    await invitation.save();

    let room = null;
    const invitationRoomId = invitation.room
      ? typeof invitation.room === "object"
        ? invitation.room.toString()
        : invitation.room
      : null;

    // If accepted, create or update a chat room
    if (status === "accepted") {
      room = await createRoomForInvitation(
        [invitation.sender.toString(), invitation.recipient.toString()],
        invitation.type === "group",
        invitationRoomId
      );
    }

    await invitation.populate("sender", "name email avatar");
    const invitationData = invitation.toObject({ virtuals: true });

    emitToUser(invitation.sender.toString(), "invitation:updated", invitationData);
    emitToUser(invitation.recipient.toString(), "invitation:updated", invitationData);

    if (room) {
      const roomData = room.toObject({ virtuals: true });
      room.members.forEach((member) => {
        emitToUser(member._id.toString(), "room:created", roomData);
      });

      emitNotification(invitation.sender.toString(), {
        type: "success",
        message: invitation.type === "group" ? "Invitation accepted" : "Chat ready",
        description:
          invitation.type === "group"
            ? `${invitation.recipient.name || "A member"} joined ${room.name || "your group"}.`
            : `${invitation.recipient.name || "The recipient"} accepted your invitation.`,
      });

      emitNotification(invitation.recipient.toString(), {
        type: "success",
        message: "Invitation accepted",
        description:
          invitation.type === "group"
            ? `You're now part of ${room.name || "the group"}.`
            : `You can start chatting with ${invitation.sender.name || "the other user"}.`,
      });
    } else if (status === "rejected") {
      emitNotification(invitation.sender.toString(), {
        type: "warning",
        message: "Invitation declined",
        description: `${invitation.recipient.name || "The user"} declined your invitation.`,
      });
    }

    return res.json(invitationData);
  } catch (error) {
    console.error("respondToInvitation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
