import { Router } from "express";
import { createRoom, listRooms } from "../controllers/roomController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/", authMiddleware, createRoom);
router.get("/", authMiddleware, listRooms);

export default router;
