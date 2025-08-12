import { Router } from "express";
import Jobs from "../controllers/jobs.controller";

const router = Router();

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination
 * @access  Public
 * @params  page, limit, search, workType, seniorityLevel, category, skills, salaryMin, salaryMax, location
 */
router.get('/', Jobs.getAllJobs);

/**
 * @route   GET /api/jobs/stats
 * @desc    Get job statistics
 * @access  Public
 */
router.get('/stats', Jobs.getJobStats);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get a single job by ID
 * @access  Public
 */
router.get('/:id', Jobs.getJobById);

export default router;