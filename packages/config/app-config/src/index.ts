import * as dotenv from "dotenv";
import { resolve, join } from "path";
import { existsSync } from "fs";

function findEnvFile(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) return null;
    dir = parent;
  }
}

const envPath = findEnvFile(process.cwd());
if (envPath) dotenv.config({ path: envPath });

export const DATABASE_URL = process.env.DATABASE_URL || "";

export const DB_POOL = {
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "10000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || "2000", 10),
} as const;

// ─── JWT / Auth ──────────────────────────────────────────────────────────────

export const JWT_SECRET =
  process.env.JWT_SECRET || "postly-secure-secret-key-2024";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "postly-secure-refresh-secret-2024";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// ─── Redis ───────────────────────────────────────────────────────────────────

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || "6379";
export const REDIS_URL =
  process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

// ─── AI / LLM ────────────────────────────────────────────────────────────────

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";
export const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-4-large";

// ─── Server ──────────────────────────────────────────────────────────────────

export const NODE_ENV = process.env.NODE_ENV || "development";
export const API_PORT = parseInt(process.env.API_PORT || "3000", 10);
export const API_URL = process.env.API_URL || "http://localhost:3000";
export const WEB_PORT = parseInt(process.env.WEB_PORT || "3001", 10);
export const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

// ─── Discord Bot (Optional) ─────────────────────────────────────────────────

export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";

// ─── Reddit Bot (Optional) ──────────────────────────────────────────────────

export const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
export const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
export const REDDIT_USER_AGENT =
  process.env.REDDIT_USER_AGENT || "postly-bot/1.0";

// ─── Dodo Payments ──────────────────────────────────────────────────────────

export const DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY || "";
export const DODO_PAYMENTS_WEBHOOK_KEY =
  process.env.DODO_PAYMENTS_WEBHOOK_KEY || "";
export const DODO_PAYMENTS_ENVIRONMENT =
  (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
  "test_mode";
export const DODO_PAYMENTS_RETURN_URL =
  process.env.DODO_PAYMENTS_RETURN_URL || "";

// ─── MinIO / S3 Storage (Optional) ──────────────────────────────────────────

export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
export const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
export const MINIO_BUCKET = process.env.MINIO_BUCKET || "postly";

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateConfig(requiredKeys: string[]): {
  valid: boolean;
  missing: string[];
} {
  const envMap: Record<string, string> = {
    DATABASE_URL,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    OPENAI_API_KEY,
    VOYAGE_API_KEY,
    REDIS_URL,
  };

  const missing = requiredKeys.filter((key) => !envMap[key]);
  return { valid: missing.length === 0, missing };
}
