import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/token.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;

    const userRecord = await User.findById(decoded.id).select("-passwordHash");
    if (!userRecord) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.userDoc = userRecord;
    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
