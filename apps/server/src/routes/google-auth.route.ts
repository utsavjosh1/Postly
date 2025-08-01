import { Router } from "express";
import { GoogleAuthController } from "../controllers/google-auth.controller";
import {
  requireAuth,
  requireGuest,
  oauthSecurityHeaders,
  oauthErrorHandler,
  validateOAuthCallback,
  handleOAuthSuccess,
} from "../middlewares/oauth.middleware";
import { authRateLimit } from "../middlewares/security.middleware";

const router = Router();

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public (guest only)
 * @rateLimit authRateLimit (stricter limit for auth endpoints)
 */
router.get(
  "/google",
  authRateLimit,
  oauthSecurityHeaders,
  requireGuest,
  GoogleAuthController.initiateGoogleAuth,
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (OAuth callback)
 * @rateLimit authRateLimit
 */
router.get(
  "/google/callback",
  authRateLimit,
  oauthSecurityHeaders,
  validateOAuthCallback,
  handleOAuthSuccess,
  GoogleAuthController.handleGoogleCallback,
);

/**
 * @route   GET /api/auth/google/user
 * @desc    Get current user from Google OAuth session
 * @access  Private (requires Google OAuth session)
 */
router.get("/google/user", requireAuth, GoogleAuthController.getCurrentUser);

/**
 * @route   POST /api/auth/google/logout
 * @desc    Logout from Google OAuth session
 * @access  Private (requires Google OAuth session)
 */
router.post("/google/logout", requireAuth, GoogleAuthController.logout);

/**
 * @route   POST /api/auth/google/unlink
 * @desc    Unlink Google account from user profile
 * @access  Private (requires authentication)
 */
router.post("/google/unlink", requireAuth, GoogleAuthController.unlinkGoogle);

/**
 * @route   GET /api/auth/connections
 * @desc    Get OAuth connection status
 * @access  Private (requires authentication)
 */
router.get(
  "/connections",
  requireAuth,
  GoogleAuthController.getConnectionStatus,
);

// Apply OAuth-specific error handler
router.use(oauthErrorHandler);

export default router;
