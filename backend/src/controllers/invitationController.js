import { Invitation } from "../models/Invitation.js";
import { User } from "../models/User.js";

export const sendInvitation = async (req, res) => {
  try {
    const { recipientEmail, message } = req.body;
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

    // Create new invitation
    const invitation = await Invitation.create({
      sender: senderId,
      recipient: recipient._id,
      message: message || "Let's connect on AlgoChat!",
    });

    // Populate sender details for response
    await invitation.populate('sender', 'name email avatar');
    
    return res.status(201).json({
      message: "Invitation sent successfully",
      invitation,
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

    // If accepted, create a chat room
    if (status === "accepted") {
      const { createRoomForInvitation } = require("./roomController");
      await createRoomForInvitation([
        invitation.sender.toString(), 
        invitation.recipient.toString()
      ]);
    }

    await invitation.populate("sender", "name email avatar");

    return res.json(invitation);
  } catch (error) {
    console.error("respondToInvitation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
