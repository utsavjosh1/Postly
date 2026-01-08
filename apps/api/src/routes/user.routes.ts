import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

const router = Router();
const userController = new UserController();

router.get("/profile", userController.getProfile);
router.patch("/profile", userController.updateProfile);

export default router;
