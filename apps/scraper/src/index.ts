import dotenv from 'dotenv';
import path from 'path';
import { Worker } from 'bullmq';
import Redis from 'ioredis';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

// Scraping worker
const worker = new Worker(
  'job-scraping',
  async (job) => {
    console.log(`Processing scraping job: ${job.id}`);
    console.log(`Source: ${job.data.source}`);

    // TODO: Implement actual scraping logic
    // This will be built in later phases

    return { success: true, jobsScraped: 0 };
  },
  { connection: redis }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🔍 Scraper service started');
console.log(`📍 Connecting to Redis at ${redisHost}:${redisPort}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await worker.close();
  await redis.quit();
  process.exit(0);
});
