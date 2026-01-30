import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postly",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Migrations table setup
const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(MIGRATIONS_TABLE);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query("SELECT name FROM migrations ORDER BY id");
  return result.rows.map((row) => row.name);
}

async function markMigrationExecuted(name: string): Promise<void> {
  await pool.query("INSERT INTO migrations (name) VALUES ($1)", [name]);
}

async function markMigrationReverted(name: string): Promise<void> {
  await pool.query("DELETE FROM migrations WHERE name = $1", [name]);
}

function getMigrationFiles(): string[] {
  // Go up from dist/migrations to find the SQL migrations folder
  const migrationsDir = path.resolve(__dirname, "../../migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function runMigrations(): Promise<void> {
  console.log("Running migrations...\n");

  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  const migrationsDir = path.resolve(__dirname, "../../migrations");

  let count = 0;
  for (const file of files) {
    if (executed.includes(file)) {
      console.log(`  ✓ ${file} (already executed)`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`  → Running ${file}...`);

    try {
      await pool.query(sql);
      await markMigrationExecuted(file);
      console.log(`  ✓ ${file} completed`);
      count++;
    } catch (error) {
      console.error(`  ✗ ${file} failed:`, error);
      process.exit(1);
    }
  }

  if (count === 0) {
    console.log("\nNo new migrations to run.");
  } else {
    console.log(`\n✓ ${count} migration(s) completed successfully.`);
  }
}

async function revertLastMigration(): Promise<void> {
  console.log("Reverting last migration...\n");

  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    console.log("No migrations to revert.");
    return;
  }

  const lastMigration = executed[executed.length - 1];
  console.log(`  → Reverting ${lastMigration}...`);

  // For now, just mark as reverted (proper down migrations would need separate .down.sql files)
  await markMigrationReverted(lastMigration);
  console.log(`  ✓ ${lastMigration} marked as reverted`);
  console.log(
    "\nNote: Tables were not dropped. Run DROP statements manually if needed.",
  );
}

async function showStatus(): Promise<void> {
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();

  console.log("Migration Status:\n");

  for (const file of files) {
    const status = executed.includes(file) ? "✓" : "○";
    console.log(`  ${status} ${file}`);
  }

  console.log(`\n${executed.length}/${files.length} migrations executed.`);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  try {
    switch (command) {
      case "up":
        await runMigrations();
        break;
      case "down":
        await revertLastMigration();
        break;
      case "status":
        await showStatus();
        break;
      default:
        console.log("Usage: migrate.js <up|down|status>");
        console.log("  up     - Run all pending migrations");
        console.log("  down   - Revert the last migration");
        console.log("  status - Show migration status");
        process.exit(1);
    }
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
