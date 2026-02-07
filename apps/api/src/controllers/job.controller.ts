import { Request, Response, NextFunction } from "express";
import { jobQueries } from "@postly/database";
import { matchingService } from "../services/matching.service.js";
import type { JobType, User } from "@postly/shared-types";

export class JobController {
  // GET /api/v1/jobs
  getJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        location,
        job_type,
        remote,
        limit = "50",
        offset = "0",
      } = req.query;

      const filters = {
        location: location as string | undefined,
        job_type: job_type as JobType | undefined,
        remote:
          remote === "true" ? true : remote === "false" ? false : undefined,
      };

      const jobs = await jobQueries.findActive(
        filters,
        parseInt(limit as string),
        parseInt(offset as string),
      );

      const total = await jobQueries.countActive();

      res.json({
        success: true,
        data: {
          jobs,
          total,
          page:
            Math.floor(parseInt(offset as string) / parseInt(limit as string)) +
            1,
          limit: parseInt(limit as string),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/jobs/:id
  getJobById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const job = await jobQueries.findById(req.params.id as string);

      if (!job) {
        res.status(404).json({
          success: false,
          error: { message: "Job not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/jobs/matches/:resumeId
  getMatches = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { resumeId } = req.params;
      const { limit = "20", with_explanations = "false" } = req.query;
      const userId = (req.user as User).id;

      let matches;
      if (with_explanations === "true") {
        matches = await matchingService.getMatchesWithExplanations(
          resumeId as string,
          userId,
          parseInt(limit as string),
        );
      } else {
        matches = await matchingService.findMatchingJobs(
          resumeId as string,
          userId,
          parseInt(limit as string),
        );
      }

      res.json({
        success: true,
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/jobs/matches/:jobId/save
  saveMatch = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const { resume_id, match_score = 0, explanation } = req.body;
      const userId = (req.user as User).id;

      if (!resume_id) {
        res.status(400).json({
          success: false,
          error: { message: "resume_id is required" },
        });
        return;
      }

      const match = await matchingService.saveMatch(
        userId,
        resume_id,
        jobId as string,
        match_score,
        explanation,
      );

      res.json({
        success: true,
        data: match,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/v1/jobs/matches/:jobId/save
  unsaveMatch = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as User).id;

      await matchingService.unsaveMatch(userId, jobId as string);

      res.json({
        success: true,
        data: { message: "Job unsaved" },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/jobs/saved
  getSavedMatches = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const saved = await matchingService.getSavedMatches(userId);

      res.json({
        success: true,
        data: saved,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/jobs/matches/:jobId/apply
  markAsApplied = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as User).id;

      await matchingService.markAsApplied(userId, jobId as string);

      res.json({
        success: true,
        data: { message: "Marked as applied" },
      });
    } catch (error) {
      next(error);
    }
  };
}
