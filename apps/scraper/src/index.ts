import dotenv from 'dotenv';
import path from 'path';
import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { getScraper, getAllScrapers, AVAILABLE_SOURCES } from './scrapers';
import type { JobSource } from '@postly/shared-types';

const isDev = process.env.NODE_ENV === 'development';
const __dirname = path.resolve();
const root = isDev ? __dirname : path.resolve(__dirname, '../..');
// Load environment variables from root .env file
dotenv.config({ path: path.resolve(root, '.env') });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

const redisConnection = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisConnection);

// Create queue for scheduling jobs
const queue = new Queue('job-scraping', { connection: redisConnection });

// Scraping worker
const worker = new Worker(
  'job-scraping',
  async (job) => {
    const { source, scrapeAll } = job.data as { source?: JobSource; scrapeAll?: boolean };

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Processing scraping job: ${job.id}`);
    console.log(`Source: ${source || 'all'}, Scrape All: ${scrapeAll}`);
    console.log(`${'='.repeat(50)}\n`);

    const results = {
      totalSaved: 0,
      totalUpdated: 0,
      totalErrors: 0,
      sources: [] as { source: string; saved: number; updated: number; errors: number }[],
    };

    try {
      if (scrapeAll || !source) {
        // Scrape all sources
        const scrapers = getAllScrapers();
        for (const scraper of scrapers) {
          try {
            const stats = await scraper.scrapeAndSave();
            results.totalSaved += stats.saved;
            results.totalUpdated += stats.updated;
            results.totalErrors += stats.errors;
            results.sources.push({ source: scraper.source, ...stats });
          } catch (error) {
            console.error(`Failed to scrape ${scraper.source}:`, error);
            results.totalErrors++;
          }
        }
      } else {
        // Scrape specific source
        const scraper = getScraper(source);
        const stats = await scraper.scrapeAndSave();
        results.totalSaved = stats.saved;
        results.totalUpdated = stats.updated;
        results.totalErrors = stats.errors;
        results.sources.push({ source, ...stats });
      }

      return results;
    } catch (error) {
      console.error('Scraping job failed:', error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one scraping job at a time
  }
);

worker.on('completed', (job, result) => {
  console.log(`\n✅ Job ${job.id} completed successfully`);
  console.log(`   Total Saved: ${result.totalSaved}`);
  console.log(`   Total Updated: ${result.totalUpdated}`);
  console.log(`   Total Errors: ${result.totalErrors}`);
});

worker.on('failed', (job, err) => {
  console.error(`\n❌ Job ${job?.id} failed:`, err.message);
});

// Setup scheduled jobs
async function setupScheduledJobs() {
  console.log('🕐 Setting up scheduled scraping jobs...');

  // Clear any existing repeatable jobs
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Schedule scraping every 4 hours
  await queue.add(
    'scrape-all',
    { scrapeAll: true },
    {
      repeat: {
        pattern: '0 */4 * * *', // Every 4 hours
      },
      jobId: 'scheduled-scrape-all',
    }
  );

  console.log('   ✓ Scheduled "scrape-all" to run every 4 hours');

  // Also add an immediate job to start scraping
  const existingJobs = await queue.getJobs(['waiting', 'active']);
  if (existingJobs.length === 0) {
    await queue.add('initial-scrape', { scrapeAll: true }, { jobId: 'initial-scrape' });
    console.log('   ✓ Added initial scrape job');
  }
}

// CLI commands
async function handleCommand(command: string) {
  switch (command) {
    case 'scrape-now':
      console.log('Adding immediate scrape job...');
      await queue.add('manual-scrape', { scrapeAll: true }, { jobId: `manual-${Date.now()}` });
      break;

    case 'scrape-wwr':
      console.log('Adding WeWorkRemotely scrape job...');
      await queue.add('manual-wwr', { source: 'weworkremotely' }, { jobId: `wwr-${Date.now()}` });
      break;

    case 'scrape-remoteco':
      console.log('Adding Remote.co scrape job...');
      await queue.add('manual-remoteco', { source: 'remote_co' }, { jobId: `remoteco-${Date.now()}` });
      break;

    case 'status':
      const waiting = await queue.getWaitingCount();
      const active = await queue.getActiveCount();
      const completed = await queue.getCompletedCount();
      const failed = await queue.getFailedCount();
      console.log(`\nQueue Status:`);
      console.log(`  Waiting: ${waiting}`);
      console.log(`  Active: ${active}`);
      console.log(`  Completed: ${completed}`);
      console.log(`  Failed: ${failed}`);
      break;

    default:
      console.log('Unknown command. Available: scrape-now, scrape-wwr, scrape-remoteco, status');
  }
}

// Main startup
async function main() {
  console.log('🔍 Scraper service starting...');
  console.log(`📍 Connecting to Redis at ${redisHost}:${redisPort}`);
  console.log(`📋 Available sources: ${AVAILABLE_SOURCES.join(', ')}`);

  await setupScheduledJobs();

  console.log('\n🚀 Scraper service started and ready!');
  console.log('   Run "npm run scrape-now" to trigger immediate scraping\n');

  // Handle stdin commands (for manual triggering)
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (data) => {
    const command = data.toString().trim();
    if (command) {
      await handleCommand(command);
    }
  });
}

main().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await worker.close();
  await queue.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await worker.close();
  await queue.close();
  await redis.quit();
  process.exit(0);
});
