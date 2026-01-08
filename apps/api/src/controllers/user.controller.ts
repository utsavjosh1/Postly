import { Request, Response } from "express";

export class UserController {
  getProfile = async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: "Get user profile - Coming soon" });
  };

  updateProfile = async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: "Update user profile - Coming soon" });
  };
}
