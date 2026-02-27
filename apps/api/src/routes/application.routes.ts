import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { ApplicationController } from "../controllers/application.controller.js";

const router = Router();
const applicationController = new ApplicationController();

router.use(authenticateToken);

// Seeker — manage own applications
router.get("/", applicationController.getMyApplications);
router.post("/", applicationController.apply);
router.get("/search", applicationController.searchByCompany);
router.get("/:id", applicationController.getById);
router.patch("/:id/notes", applicationController.updateNotes);
router.delete("/:id", applicationController.deleteApplication);

// Employer — view applicant pipeline for a job posting
router.get("/job/:jobId", applicationController.getJobApplicants);

// Status updates (typically triggered by employer or admin)
router.patch("/:id/status", applicationController.updateStatus);

export default router;
