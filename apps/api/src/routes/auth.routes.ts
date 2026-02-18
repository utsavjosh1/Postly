import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const authController = new AuthController();

// Public
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected
router.get("/me", authenticateToken, authController.me);

export default router;
