import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "@postly/config";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for drizzle-kit.\n" +
      "Add it to your .env file: DATABASE_URL=postgresql://user:pass@localhost:5432/postly",
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
