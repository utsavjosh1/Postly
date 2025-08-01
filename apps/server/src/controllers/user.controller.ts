import type { Request, Response } from "express";
import { getAllUsers } from "../services/user.service";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const getUsers = (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = getAllUsers();

    res.status(200).json({
      success: true,
      data: { users },
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get current user info (authenticated user only)
export const getCurrentUser = (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: req.user },
      message: "Current user retrieved successfully",
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
