import { User } from "../models/User.js";

export const listUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const filters = {
      _id: { $ne: req.user.id },
    };

    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filters).select(
      "name email avatar onlineStatus lastSeen createdAt encryptionPublicKey"
    );

    return res.json(users);
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, encryptionPublicKey } = req.body;

    const update = {};
    if (typeof name === "string" && name.trim()) {
      update.name = name.trim();
    }
    if (typeof avatar === "string") {
      update.avatar = avatar;
    }
    if (typeof encryptionPublicKey === "string" && encryptionPublicKey.trim()) {
      update.encryptionPublicKey = encryptionPublicKey.trim();
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    update.lastSeen = new Date();

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
