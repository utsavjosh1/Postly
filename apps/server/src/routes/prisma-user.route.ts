import { Router } from "express";
import {
  getPrismaUsers,
  getCurrentPrismaUser,
} from "../controllers/prisma-user.controller";
import {
  prismaAuthenticate,
  prismaOptionalAuth,
} from "../middlewares/prisma-auth.middleware";

const router = Router();

// Public route with optional authentication
router.get("/", prismaOptionalAuth, getPrismaUsers);

// Protected route - get current authenticated user
router.get("/me", prismaAuthenticate, getCurrentPrismaUser);

export default router;
