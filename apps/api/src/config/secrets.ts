import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables immediately
dotenv.config({ path: resolve(process.cwd(), ".env") });

export const JWT_SECRET = process.env.JWT_SECRET || "postly-secure-secret-key-2024";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "postly-secure-refresh-secret-2024";
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const WEB_URL = process.env.WEB_URL || "http://localhost:3001";
