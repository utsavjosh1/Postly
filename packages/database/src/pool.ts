import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10, // Reduced for low-memory environments
  idleTimeoutMillis: 10000, // Close idle clients faster to save memory
  connectionTimeoutMillis: 2000, // Return an error if connection takes longer than 2 seconds
};

export const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

export default pool;
