import { PrismaAuthService } from "./prisma-auth.service";
import type { User } from "../types/auth.types";

export const getAllUsersWithPrisma = async (): Promise<User[]> => {
  return await PrismaAuthService.getAllUsers();
};
