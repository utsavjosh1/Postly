import type { Request, Response } from "express";
import { getAllUsersWithPrisma } from "../services/prisma-user.service";
import type { PrismaAuthenticatedRequest } from "../middlewares/prisma-auth.middleware";

export const getPrismaUsers = async (req: PrismaAuthenticatedRequest, res: Response) => {
  try {
    const users = await getAllUsersWithPrisma();
    
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
export const getCurrentPrismaUser = (req: PrismaAuthenticatedRequest, res: Response) => {
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
