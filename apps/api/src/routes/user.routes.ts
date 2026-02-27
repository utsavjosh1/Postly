import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const userController = new UserController();

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

export default router;
