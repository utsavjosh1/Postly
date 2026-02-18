import { drizzle } from "drizzle-orm/node-postgres";
import { pool as existingPool } from "./pool";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set, using default for build/dev");
}

export const db = drizzle(existingPool, { schema });

export { schema };

export { existingPool as pool };

export * from "./queries";
