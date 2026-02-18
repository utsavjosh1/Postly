/**
 * Re-exports from the centralized @postly/config package.
 * All env vars are loaded and validated there.
 *
 * Existing imports like `import { JWT_SECRET } from "../config/secrets.js"`
 * continue to work unchanged.
 */
export {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  GEMINI_API_KEY,
  WEB_URL,
  REDIS_URL,
  API_PORT,
  NODE_ENV,
  DATABASE_URL,
} from "@postly/config";
