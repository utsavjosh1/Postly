import { Request, Response } from "express";

export class UserController {
  getProfile = async (req: Request, res: Response): Promise<void> => {
    // req.user is populated by authenticateToken middleware
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, error: { message: "User not authenticated" } });
      return;
    }

    res.json({
      success: true,
      data: req.user,
    });
  };

  updateProfile = async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: "Update user profile - Coming soon" });
  };
}
