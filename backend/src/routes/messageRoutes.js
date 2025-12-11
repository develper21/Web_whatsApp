import { Router } from "express";
import { fetchMessages } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/:roomId", authMiddleware, fetchMessages);
router.post(
  "/upload",
  authMiddleware,
  upload.array("files", 4),
  (req, res) => {
    const files = (req.files || []).map((file) => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
    }));
    return res.status(201).json({ files });
  }
);

export default router;
