import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  sendInvitation,
  getInvitations,
  respondToInvitation,
} from "../controllers/invitationController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", sendInvitation);
router.get("/", getInvitations);
router.patch("/:invitationId/respond", respondToInvitation);

export default router;
