import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  
  // Google OAuth Configuration (optional in development)
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required").optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required").optional(),
  GOOGLE_CALLBACK_URL: z.string().url("Invalid Google callback URL").default("http://localhost:3001/api/auth/google/callback"),
  
  // Session Configuration
  SESSION_SECRET: z.string().min(32, "Session secret must be at least 32 characters").optional(),
  
  // Frontend URL for redirects
  FRONTEND_URL: z.string().url("Invalid frontend URL").default("http://localhost:5173"),
  
  // Database Configuration (optional)
  DATABASE_URL: z.string().optional(),
  
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
