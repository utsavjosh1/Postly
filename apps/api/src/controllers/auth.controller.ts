import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { userQueries } from "@postly/database";
import type { AuthResponse, User } from "@postly/shared-types";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "7d") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "30d") as SignOptions["expiresIn"];

const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

export class AuthController {
  private generateTokens(user: User) {
    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const refresh_token = jwt.sign(
      { id: user.id, type: "refresh" },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN },
    );

    return { access_token, refresh_token };
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email, password, full_name } = validation.data;

      const existingUser = await userQueries.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { message: "User with this email already exists" },
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const user = await userQueries.create({
        email,
        password_hash,
        full_name,
      });

      const tokens = this.generateTokens(user);

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        ...tokens,
      };

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email, password } = validation.data;

      const user = await userQueries.findByEmail(email);
      if (!user || user.password_hash === "") {
        // No password for social login users
        res.status(401).json({
          success: false,
          error: { message: "Invalid email or password" },
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: { message: "Invalid email or password" },
        });
        return;
      }

      const tokens = this.generateTokens(user);

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        ...tokens,
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = refreshSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { refresh_token } = validation.data;

      let decoded: { id: string; type: string };
      try {
        decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as {
          id: string;
          type: string;
        };
      } catch {
        res.status(401).json({
          success: false,
          error: { message: "Invalid or expired refresh token" },
        });
        return;
      }

      if (decoded.type !== "refresh") {
        res.status(401).json({
          success: false,
          error: { message: "Invalid token type" },
        });
        return;
      }

      const user = await userQueries.findById(decoded.id);
      if (!user) {
        res.status(401).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      const access_token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      res.json({
        success: true,
        data: { access_token },
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userQueries.findById(req.user!.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const tokens = this.generateTokens(user);

      // Redirect to frontend with tokens
      // In a real app, this should probably use a secure cookie or a temporary code exchange
      // For simplicity, we'll pass it in the URL hash or query params
      res.redirect(
        `${WEB_URL}/auth/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
      );
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${WEB_URL}/login?error=auth_failed`);
    }
  };
}
