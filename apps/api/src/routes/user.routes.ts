import { Router } from "express";
import multer from "multer";
import path from "path";
import { UserController } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const userController = new UserController();

// Configure storage for avatars
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/avatars");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

router.use(authenticateToken);

// Base profile
router.get("/profile", userController.getProfile);
router.patch("/profile", userController.updateProfile);

// Seeker profile (resume-based extended data)
router.get("/seeker-profile", userController.getSeekerProfile);
router.patch("/seeker-profile", userController.updateSeekerProfile);

// Employer profile (company details)
router.get("/employer-profile", userController.getEmployerProfile);
router.patch("/employer-profile", userController.updateEmployerProfile);

// Subscription status
router.get("/subscription", userController.getSubscription);

// Security
router.post("/change-password", userController.changePassword);

// Avatar
router.post("/upload-avatar", upload.single("avatar"), userController.uploadAvatar);

export default router;
