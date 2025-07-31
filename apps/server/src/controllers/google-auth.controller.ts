import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { config } from '../config/env';
import { generateOAuthState } from '../middlewares/oauth.middleware';
import type { GoogleAuthResponse } from '../types/auth.types';
import * as jwt from 'jsonwebtoken';

export class GoogleAuthController {
  /**
   * Initiate Google OAuth authentication
   * Generates secure state parameter and redirects to Google
   */
  static initiateGoogleAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate and store OAuth state for CSRF protection
      const state = generateOAuthState();
      (req.session as any).oauth_state = state;

      // Store return URL if provided
      const returnTo = req.query.returnTo as string;
      if (returnTo && isValidReturnUrl(returnTo)) {
        (req.session as any).returnTo = returnTo;
      }

      // Configure authentication options
      const authOptions = {
        scope: ['profile', 'email'],
        state: state,
        prompt: typeof req.query.prompt === 'string' ? req.query.prompt : 'select_account',
        accessType: 'offline' as const,
        includeGrantedScopes: true
      };

      // Redirect to Google OAuth
      passport.authenticate('google', authOptions)(req, res, next);
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication initialization failed',
        message: 'Unable to start Google authentication process'
      });
    }
  };

  /**
   * Handle Google OAuth callback
   * Processes the OAuth response and creates user session
   */
  static handleGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { 
      failureRedirect: `${config.FRONTEND_URL}/login?error=oauth_failed`,
      session: true
    }, async (err: any, user: Express.User | false, info: any) => {
      try {
        if (err) {
          console.error('Google OAuth error:', err);
          return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_error&message=${encodeURIComponent(err.message)}`);
        }

        if (!user) {
          console.error('Google OAuth failed - no user returned:', info);
          return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_failed&message=${encodeURIComponent(info?.message || 'Authentication failed')}`);
        }

        // Log the user in (create session)
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Session creation error:', loginErr);
            return res.redirect(`${config.FRONTEND_URL}/login?error=session_error`);
          }

          // Generate JWT token for API access
          const tokenPayload = {
            user_id: user.supabase_user_id,
            email: user.email,
            provider: user.provider
          };

          const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN || '7d',
            issuer: 'jobbot-auth',
            subject: user.supabase_user_id
          } as jwt.SignOptions);

          // Get return URL or default to dashboard
          const returnTo = (req.session as any)?.returnTo || '/dashboard';
          delete (req.session as any)?.returnTo; // Clean up

          // Redirect with success and token
          const redirectUrl = `${config.FRONTEND_URL}${returnTo}?auth_success=true&token=${encodeURIComponent(accessToken)}`;
          res.redirect(redirectUrl);
        });
      } catch (error) {
        console.error('Error in Google callback:', error);
        res.redirect(`${config.FRONTEND_URL}/login?error=callback_error`);
      }
    })(req, res, next);
  };

  /**
   * Get current user from Google OAuth session
   * Returns user data if authenticated via Google OAuth
   */
  static getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'No active Google OAuth session found'
        });
        return;
      }

      const user = req.user;
      const response: GoogleAuthResponse = {
        success: true,
        user: {
          id: user.supabase_user_id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          provider: user.provider,
          created_at: new Date().toISOString(), // This should come from database
          updated_at: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data',
        message: 'Unable to retrieve current user information'
      });
    }
  };

  /**
   * Logout user from Google OAuth session
   * Destroys session and redirects to frontend
   */
  static logout = async (req: Request, res: Response): Promise<void> => {
    try {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({
            success: false,
            error: 'Logout failed',
            message: 'Unable to complete logout process'
          });
        }

        // Destroy session
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error('Session destruction error:', sessionErr);
          }

          res.json({
            success: true,
            message: 'Successfully logged out',
            redirect_url: `${config.FRONTEND_URL}/login`
          });
        });
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        error: 'Logout error',
        message: 'An error occurred during logout'
      });
    }
  };

  /**
   * Unlink Google account from user profile
   * Removes Google OAuth connection while preserving user account
   */
  static unlinkGoogle = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Authentication required to unlink account'
        });
        return;
      }

      // This would require additional logic to handle account unlinking
      // For now, return a placeholder response
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Account unlinking feature is not yet implemented'
      });
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      res.status(500).json({
        success: false,
        error: 'Unlink failed',
        message: 'Unable to unlink Google account'
      });
    }
  };

  /**
   * Get OAuth connection status
   * Returns information about connected OAuth providers
   */
  static getConnectionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const connections = {
        google: {
          connected: req.user.provider === 'google',
          email: req.user.provider === 'google' ? req.user.email : null,
          avatar_url: req.user.provider === 'google' ? req.user.avatar_url : null
        }
      };

      res.json({
        success: true,
        connections
      });
    } catch (error) {
      console.error('Error getting connection status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get connection status'
      });
    }
  };
}

/**
 * Validate return URL to prevent open redirect attacks
 */
function isValidReturnUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url, config.FRONTEND_URL);
    
    // Only allow same-origin URLs or relative paths
    return parsedUrl.origin === new URL(config.FRONTEND_URL).origin || 
           url.startsWith('/');
  } catch {
    return false;
  }
}
