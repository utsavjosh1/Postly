import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("8000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database Configuration
  DATABASE_URL: z.string().url("Invalid database URL"),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url("Invalid Google callback URL")
    .default("http://localhost:8000/api/auth/google/callback"),

  // Session Configuration
  SESSION_SECRET: z
    .string()
    .min(32, "Session secret must be at least 32 characters"),

  // Frontend URL for redirects
  FRONTEND_URL: z
    .string()
    .url("Invalid frontend URL")
    .default("http://localhost:3000"),

  // GCP Configuration
  GCP_PROJECT_ID: z.string().optional(),
  GCP_REGION: z.string().default("us-central1"),
});

type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:", error);
    process.exit(1);
  }
};

export const config = parseEnv();

export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
