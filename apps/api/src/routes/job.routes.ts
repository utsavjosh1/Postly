import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { matchingService } from '../services/matching.service.js';
import { jobQueries } from '@postly/database';
import type { JobType } from '@postly/shared-types';

const router = Router();

/**
 * GET /api/v1/jobs
 * Get active jobs with optional filters
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location, job_type, remote, limit = '50', offset = '0' } = req.query;

    const filters = {
      location: location as string | undefined,
      job_type: job_type as JobType | undefined,
      remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
    };

    const jobs = await jobQueries.findActive(
      filters,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    const total = await jobQueries.countActive();

    res.json({
      success: true,
      data: {
        jobs,
        total,
        page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get jobs' },
    });
  }
});

/**
 * GET /api/v1/jobs/matches/:resumeId
 * Get job matches for a resume
 */
router.get('/matches/:resumeId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const { resumeId } = req.params;
    const { limit = '20', with_explanations = 'false' } = req.query;

    let matches;
    if (with_explanations === 'true') {
      matches = await matchingService.getMatchesWithExplanations(
        resumeId,
        req.user.id,
        parseInt(limit as string)
      );
    } else {
      matches = await matchingService.findMatchingJobs(
        resumeId,
        req.user.id,
        parseInt(limit as string)
      );
    }

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get job matches',
      },
    });
  }
});

/**
 * POST /api/v1/jobs/matches/:jobId/save
 * Save a job match
 */
router.post('/matches/:jobId/save', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const { jobId } = req.params;
    const { resume_id, match_score = 0, explanation } = req.body;

    if (!resume_id) {
      res.status(400).json({
        success: false,
        error: { message: 'resume_id is required' },
      });
      return;
    }

    const match = await matchingService.saveMatch(
      req.user.id,
      resume_id,
      jobId,
      match_score,
      explanation
    );

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Save match error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save job match' },
    });
  }
});

/**
 * DELETE /api/v1/jobs/matches/:jobId/save
 * Unsave a job match
 */
router.delete('/matches/:jobId/save', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const { jobId } = req.params;
    await matchingService.unsaveMatch(req.user.id, jobId);

    res.json({
      success: true,
      data: { message: 'Job unsaved' },
    });
  } catch (error) {
    console.error('Unsave match error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to unsave job' },
    });
  }
});

/**
 * GET /api/v1/jobs/saved
 * Get saved job matches
 */
router.get('/saved', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const saved = await matchingService.getSavedMatches(req.user.id);

    res.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    console.error('Get saved matches error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get saved jobs' },
    });
  }
});

/**
 * POST /api/v1/jobs/matches/:jobId/apply
 * Mark a job as applied
 */
router.post('/matches/:jobId/apply', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const { jobId } = req.params;
    await matchingService.markAsApplied(req.user.id, jobId);

    res.json({
      success: true,
      data: { message: 'Marked as applied' },
    });
  } catch (error) {
    console.error('Mark applied error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark job as applied' },
    });
  }
});

/**
 * GET /api/v1/jobs/:id
 * Get a specific job by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await jobQueries.findById(req.params.id);

    if (!job) {
      res.status(404).json({
        success: false,
        error: { message: 'Job not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get job' },
    });
  }
});

export default router;
