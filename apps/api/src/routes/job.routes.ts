import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { JobController } from "../controllers/job.controller.js";

const router = Router();
const jobController = new JobController();

// Public routes
router.get("/", jobController.getJobs);
router.get("/:id", jobController.getJobById);

// Protected routes
router.use(authenticateToken);
router.get("/matches/:resumeId", jobController.getMatches);
router.get("/saved", jobController.getSavedMatches);
router.post("/matches/:jobId/save", jobController.saveMatch);
router.delete("/matches/:jobId/save", jobController.unsaveMatch);
router.post("/matches/:jobId/apply", jobController.markAsApplied);

export default router;
