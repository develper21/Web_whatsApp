import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String },
    originalName: { type: String },
    size: { type: Number },
    originalType: { type: String },
    originalSize: { type: Number },
    encryption: {
      algorithm: { type: String },
      iv: { type: String },
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    attachments: [attachmentSchema],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    clientMessageId: { type: String },
    encryption: {
      algorithm: { type: String },
      iv: { type: String },
      recipients: [
        {
          userId: { type: String },
          encryptedKey: { type: String },
        },
      ],
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
