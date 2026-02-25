import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./pool";
import * as schema from "./schema";

export const db = drizzle(pool, { schema });

export { schema };
export * from "./schema";
export { pool };
export * from "./queries";
export * from "drizzle-orm";
