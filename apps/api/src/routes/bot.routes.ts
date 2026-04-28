import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { BotController } from "../controllers/bot.controller.js";

const router = Router();
const botController = new BotController();

// Some bot platforms might use callbacks (OAuth)
// We keep them separate and authenticate if possible, but usually these are handled via state/session.
// Here we assume authenticateToken works for our flow.
router.get("/discord/callback", authenticateToken, botController.handleDiscordCallback);

// Protected management routes
router.use(authenticateToken);

router.get("/configs", botController.getConfigs);
router.post("/configs", botController.upsertConfig);
router.patch("/configs/:id", botController.updateConfig);
router.post("/configs/:id/test", botController.triggerTestNotification);

export default router;
