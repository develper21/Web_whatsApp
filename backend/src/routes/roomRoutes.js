import { Router } from "express";
import { createRoom, listRooms, inviteMembers } from "../controllers/roomController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/", authMiddleware, createRoom);
router.get("/", authMiddleware, listRooms);
router.post("/:roomId/invite", authMiddleware, inviteMembers);

export default router;
