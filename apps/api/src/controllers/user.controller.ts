import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { userQueries } from "@postly/database";
import type { JwtPayload } from "../middleware/auth.js";

// ─── Validation ──────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name cannot be empty")
    .max(100, "Full name is too long")
    .optional(),
});

// ─── Controller ──────────────────────────────────────────────────────────────

export class UserController {
  // GET /api/v1/users/profile
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.user as JwtPayload;
      const user = await userQueries.findById(payload.id);

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
          is_verified: user.is_verified,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/v1/users/profile
  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const payload = req.user as JwtPayload;
      const updated = await userQueries.update(payload.id, validation.data);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: updated.id,
          email: updated.email,
          full_name: updated.full_name,
          role: updated.role,
          is_verified: updated.is_verified,
          last_login_at: updated.last_login_at,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
