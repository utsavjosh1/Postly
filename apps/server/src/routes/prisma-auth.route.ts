import { Router } from "express";
import { PrismaAuthController } from "../controllers/prisma-auth.controller";
import {
  prismaAuthenticate,
  prismaOptionalAuth,
} from "../middlewares/prisma-auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.post("/register", PrismaAuthController.register);
router.post("/login", PrismaAuthController.login);
router.post("/refresh-token", PrismaAuthController.refreshToken);
router.post(
  "/request-password-reset",
  PrismaAuthController.requestPasswordReset,
);
router.get("/health", PrismaAuthController.healthCheck);

// Protected routes (authentication required)
router.post("/logout", prismaAuthenticate, PrismaAuthController.logout);
router.get("/profile", prismaAuthenticate, PrismaAuthController.getProfile);
router.put("/profile", prismaAuthenticate, PrismaAuthController.updateProfile);
router.post(
  "/change-password",
  prismaAuthenticate,
  PrismaAuthController.changePassword,
);

export default router;
