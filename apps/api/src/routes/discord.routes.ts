import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { DiscordController } from "../controllers/discord.controller.js";

const router = Router();
const discordController = new DiscordController();

// All discord routes are protected
router.use(authenticateToken);

router.get("/callback", discordController.handleCallback);
router.get("/configs", discordController.getConfigs);
router.patch("/configs/:id", discordController.updateConfig);
router.post("/test-notification", discordController.triggerTestNotification);
router.post("/link-server", discordController.linkServer);

export default router;
