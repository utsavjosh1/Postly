import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/supabase";
import { config } from "../config/env";

export interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ 
        error: "Missing or invalid authorization header" 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Try to verify with Supabase first
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      // Fallback to JWT verification if using custom JWT
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        req.user = {
          id: `jwt_${decoded.sub || decoded.userId}`,
          email: decoded.email,
          supabase_user_id: decoded.sub || decoded.userId,
          provider: decoded.provider || 'email'
        };
      } catch (jwtError) {
        res.status(401).json({ 
          error: "Invalid token" 
        });
        return;
      }
    } else {
      req.user = {
        id: `supabase_${user.id}`,
        email: user.email!,
        supabase_user_id: user.id,
        provider: user.user_metadata?.provider || 'email'
      };
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ 
      error: "Internal server error during authentication" 
    });
  }
};

export const authorize = (roles: string[] = []) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: "Authentication required" 
      });
      return;
    }

    // TODO: Implement role-based authorization when roles are added to the system
    // For now, just check if user is authenticated
    if (roles.length > 0) {
      // Placeholder for role checking - currently allows all authenticated users
      console.log(`Role check requested for roles: ${roles.join(', ')}, but not implemented yet`);
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No auth header, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    // Try to verify with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (!error && user) {
      req.user = {
        id: `supabase_${user.id}`,
        email: user.email!,
        supabase_user_id: user.id,
        provider: user.user_metadata?.provider || 'email'
      };
    }

    next();
  } catch (error) {
    // If there's an error, just continue without user
    console.warn("Optional auth error:", error);
    next();
  }
};
