import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";
import { ResumeController } from "../controllers/resume.controller.js";

const router = Router();
const resumeController = new ResumeController();

// Configure multer for memory storage (we'll process the buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOCX files are allowed."));
    }
  },
});

// All resume routes require authentication
router.use(authenticateToken);

router.post("/upload", upload.single("resume"), resumeController.uploadResume);
router.get("/", resumeController.getResumes);
router.get("/:id", resumeController.getResumeById);
router.delete("/:id", resumeController.deleteResume);
router.post("/:id/reanalyze", resumeController.reanalyzeResume);

export default router;
