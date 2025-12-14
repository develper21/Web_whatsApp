import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      index: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    roomName: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    message: { type: String, default: "Let's connect on AlgoChat!" },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

invitationSchema.index({ sender: 1, recipient: 1, type: 1, room: 1 }, { unique: true });

export const Invitation = mongoose.model("Invitation", invitationSchema);
