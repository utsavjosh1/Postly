import { Request, Response, NextFunction } from "express";
import { resumeService } from "../services/resume.service.js";

import type { User } from "@postly/shared-types";

export class ResumeController {
  // POST /api/v1/resumes/upload
  uploadResume = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: "No file uploaded" },
        });
        return;
      }

      const userId = (req.user as User).id;

      // For now, we'll store the file URL as a placeholder
      // In production, you'd upload to S3/GCS and get a real URL
      const fileUrl = `uploads/${userId}/${Date.now()}-${req.file.originalname}`;

      const resume = await resumeService.processResume(
        userId,
        fileUrl,
        req.file.buffer,
        req.file.mimetype,
      );

      res.status(201).json({
        success: true,
        data: resume,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/resumes
  getResumes = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const resumes = await resumeService.getUserResumes(userId);

      res.json({
        success: true,
        data: resumes,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/resumes/:id
  getResumeById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const resume = await resumeService.getResumeById(
        req.params.id as string,
        userId,
      );

      if (!resume) {
        res.status(404).json({
          success: false,
          error: { message: "Resume not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: resume,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/v1/resumes/:id
  deleteResume = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const deleted = await resumeService.deleteResume(
        req.params.id as string,
        userId,
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { message: "Resume not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: { message: "Resume deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/resumes/:id/reanalyze
  reanalyzeResume = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const resume = await resumeService.reanalyzeResume(
        req.params.id as string,
        userId,
      );

      if (!resume) {
        res.status(404).json({
          success: false,
          error: { message: "Resume not found or has no parsed text" },
        });
        return;
      }

      res.json({
        success: true,
        data: resume,
      });
    } catch (error) {
      next(error);
    }
  };
}
