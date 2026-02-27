import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { JobController } from "../controllers/job.controller.js";

const router = Router();
const jobController = new JobController();

// Public — must be declared before :id to avoid shadowing
router.get("/", jobController.getJobs);

// Protected — declare specific paths before /:id pattern
router.use(authenticateToken);
router.get("/matches", jobController.getMatches);
router.get("/saved", jobController.getSavedMatches);
router.post("/matches/:jobId/save", jobController.saveMatch);
router.delete("/matches/:jobId/save", jobController.unsaveMatch);
router.post("/matches/:jobId/apply", jobController.markAsApplied);

// Wildcard — keep last so it doesn't swallow authenticated sub-paths
router.get("/:id", jobController.getJobById);

export default router;
