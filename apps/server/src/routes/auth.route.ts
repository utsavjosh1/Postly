import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Auth routes working!" });
});

export default router;
