import { Pool } from "pg";
import { DATABASE_URL, DB_POOL } from "@postly/config";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: DB_POOL.max,
  idleTimeoutMillis: DB_POOL.idleTimeoutMillis,
  connectionTimeoutMillis: DB_POOL.connectionTimeoutMillis,
});

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

export default pool;
