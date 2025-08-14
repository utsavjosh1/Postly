import { Router } from "express";
const router = Router();

import { authRateLimit } from "../middlewares/security.middleware";

import AuthenticationRoute from "./auth.route";
import JobsRoute from "./jobs.route";

router.use("/auth", authRateLimit, AuthenticationRoute);
router.use("/jobs", JobsRoute);

export default router;
