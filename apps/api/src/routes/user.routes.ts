import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const userController = new UserController();

router.get("/profile", authenticateToken, userController.getProfile);
router.patch("/profile", authenticateToken, userController.updateProfile);

export default router;
