import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    onlineStatus: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    avatar: { type: String },
    encryptionPublicKey: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
