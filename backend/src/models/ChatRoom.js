import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    isGroup: { type: Boolean, default: false },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

chatRoomSchema.virtual("membersCount").get(function () {
  return this.members?.length || 0;
});

chatRoomSchema.set("toJSON", { virtuals: true });
chatRoomSchema.set("toObject", { virtuals: true });

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
