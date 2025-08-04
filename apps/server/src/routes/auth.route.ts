import { Router } from "express";
import passport from "passport";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

const router = Router();

// Auth middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

// Auth status check
router.get("/status", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
      },
    });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${config.FRONTEND_URL}/auth/error`,
  }),
  (req: Request, res: Response) => {
    // Successful authentication
    console.log("✅ Google OAuth successful for user:", req.user?.email);
    res.redirect(`${config.FRONTEND_URL}/dashboard`);
  }
);

// Logout
router.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error("Session destroy error:", sessionErr);
        return res.status(500).json({ error: "Session cleanup failed" });
      }
      
      res.clearCookie("jobbot.sid");
      res.json({ message: "Logout successful" });
    });
  });
});

// Get current user profile
router.get("/me", requireAuth, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not found" });
  }
  
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
    },
  });
});

// Test route
router.get("/test", (req: Request, res: Response) => {
  res.json({ 
    message: "Auth routes working!",
    authenticated: req.isAuthenticated(),
    session: req.sessionID
  });
});

export default router;
