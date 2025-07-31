import { Router } from "express";
import { getUsers, getCurrentUser } from "../controllers/user.controller";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public route with optional authentication
router.get("/", optionalAuth, getUsers);

// Protected route - get current authenticated user
router.get("/me", authenticate, getCurrentUser);

export default router;
