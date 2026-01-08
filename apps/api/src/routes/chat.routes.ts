import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { chatRateLimiter } from "../middleware/strict-rate-limit.js";
import { ChatController } from "../controllers/chat.controller.js";

const router = Router();
const chatController = new ChatController();

// Rate limit for AI chat - 3 requests per week per user
const chatStreamLimiter = chatRateLimiter;

// All routes require authentication
router.use(authenticateToken);

router.get("/conversations", chatController.getConversations);
router.post("/conversations", chatController.createConversation);
router.get("/conversations/:id", chatController.getConversationById);
router.delete("/conversations/:id", chatController.deleteConversation);
router.post("/stream", chatStreamLimiter, chatController.streamResponse);

export default router;
