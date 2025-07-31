import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/request-password-reset", AuthController.requestPasswordReset);
router.get("/health", AuthController.healthCheck);

// Protected routes (authentication required)
router.post("/logout", authenticate, AuthController.logout);
router.get("/profile", authenticate, AuthController.getProfile);
router.put("/profile", authenticate, AuthController.updateProfile);
router.post("/change-password", authenticate, AuthController.changePassword);

export default router;
