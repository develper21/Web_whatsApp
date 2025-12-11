import { Router } from "express";
import { listUsers, updateProfile } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, listUsers);
router.put("/me", authMiddleware, updateProfile);

export default router;
