import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables immediately from the root of the monorepo
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const JWT_SECRET =
  process.env.JWT_SECRET || "postly-secure-secret-key-2024";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "postly-secure-refresh-secret-2024";
export const WEB_URL = process.env.WEB_URL || "http://localhost:3001";
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
export const REDIS_URL =
  process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;
