import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  userQueries,
  seekerProfileQueries,
  employerProfileQueries,
  subscriptionQueries,
} from "@postly/database";
import type { JwtPayload } from "../middleware/auth.js";

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
});

const updateSeekerProfileSchema = z.object({
  headline: z.string().max(500).optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience_years: z.number().int().optional(),
  experience_level: z
    .enum(["entry", "mid", "senior", "lead", "executive"])
    .optional(),
  desired_job_titles: z.array(z.string()).optional(),
  desired_locations: z.array(z.string()).optional(),
  desired_salary_min: z.string().optional(),
  desired_salary_max: z.string().optional(),
  desired_job_type: z
    .enum(["full_time", "part_time", "contract", "freelance", "internship"])
    .optional(),
  open_to_remote: z.boolean().optional(),
  open_to_relocation: z.boolean().optional(),
});

const updateEmployerProfileSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  company_website: z.string().url().optional(),
  company_logo_url: z.string().url().optional(),
  company_description: z.string().optional(),
  company_size: z.string().optional(),
  industry: z.string().max(150).optional(),
  headquarters_location: z.string().max(255).optional(),
  social_links: z.record(z.string()).optional(),
});

export class UserController {
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.user as JwtPayload;
      const user = await userQueries.findById(payload.id);
      if (!user) {
        res
          .status(404)
          .json({ success: false, error: { message: "User not found" } });
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

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res
          .status(400)
          .json({
            success: false,
            error: { message: validation.error.errors[0].message },
          });
        return;
      }
      const payload = req.user as JwtPayload;
      const updated = await userQueries.update(payload.id, validation.data);
      if (!updated) {
        res
          .status(404)
          .json({ success: false, error: { message: "User not found" } });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  getSeekerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.user as JwtPayload;
      const profile = await seekerProfileQueries.findByUserId(payload.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  updateSeekerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = updateSeekerProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res
          .status(400)
          .json({
            success: false,
            error: { message: validation.error.errors[0].message },
          });
        return;
      }
      const payload = req.user as JwtPayload;
      const updated = await seekerProfileQueries.update(
        payload.id,
        validation.data,
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  getEmployerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.user as JwtPayload;
      const profile = await employerProfileQueries.findByUserId(payload.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  updateEmployerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = updateEmployerProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res
          .status(400)
          .json({
            success: false,
            error: { message: validation.error.errors[0].message },
          });
        return;
      }
      const payload = req.user as JwtPayload;
      const profile = await employerProfileQueries.findByUserId(payload.id);
      const result = profile
        ? await employerProfileQueries.update(payload.id, validation.data)
        : await employerProfileQueries.create(payload.id, {
            company_name: validation.data.company_name ?? "",
            ...validation.data,
          });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.user as JwtPayload;
      const subscription = await subscriptionQueries.findByUserId(payload.id);
      res.json({
        success: true,
        data: subscription ?? { plan: "free", status: "active" },
      });
    } catch (error) {
      next(error);
    }
  };
}
