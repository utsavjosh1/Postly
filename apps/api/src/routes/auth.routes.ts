import { Router } from "express";
import passport from "../config/passport.js";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const authController = new AuthController();

// Basic Auth
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.get("/me", authenticateToken, authController.me);

// Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.googleCallback,
);

export default router;
