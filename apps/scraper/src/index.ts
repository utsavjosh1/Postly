import dotenv from 'dotenv';
import path from 'path';
import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { getScraper, getAllScrapers, AVAILABLE_SOURCES } from './scrapers';
import { browserManager } from './utils/browser';
import { runCleanup } from './workers/cleanup.worker';
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

// Create queues for scheduling jobs
const scrapingQueue = new Queue('job-scraping', { connection: redisConnection });
const cleanupQueue = new Queue('job-cleanup', { connection: redisConnection });

// Scraping worker
const scrapingWorker = new Worker(
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
      totalSkipped: 0,
      totalErrors: 0,
      sources: [] as { source: string; saved: number; updated: number; skipped: number; errors: number }[],
    };

    try {
      // Initialize browser before scraping
      await browserManager.initialize();

      if (scrapeAll || !source) {
        // Scrape all sources
        const scrapers = getAllScrapers();
        for (const scraper of scrapers) {
          try {
            const stats = await scraper.scrapeAndSave();
            results.totalSaved += stats.saved;
            results.totalUpdated += stats.updated;
            results.totalSkipped += stats.skipped;
            results.totalErrors += stats.errors;
            results.sources.push({ source: scraper.source, ...stats });

            // Rotate browser context between sources to avoid detection
            await browserManager.rotateContext();
          } catch (error) {
            console.error(`Failed to scrape ${scraper.source}:`, error);
            results.totalErrors++;
            results.sources.push({
              source: scraper.source,
              saved: 0,
              updated: 0,
              skipped: 0,
              errors: 1,
            });
          }
        }
      } else {
        // Scrape specific source
        const scraper = getScraper(source);
        const stats = await scraper.scrapeAndSave();
        results.totalSaved = stats.saved;
        results.totalUpdated = stats.updated;
        results.totalSkipped = stats.skipped;
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

// Cleanup worker
const cleanupWorker = new Worker(
  'job-cleanup',
  async (job) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Processing cleanup job: ${job.id}`);
    console.log(`${'='.repeat(50)}\n`);

    try {
      const result = await runCleanup();
      return result;
    } catch (error) {
      console.error('Cleanup job failed:', error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

scrapingWorker.on('completed', (job, result) => {
  console.log(`\n✅ Scraping job ${job.id} completed successfully`);
  console.log(`   Total Saved: ${result.totalSaved}`);
  console.log(`   Total Updated: ${result.totalUpdated}`);
  console.log(`   Total Skipped: ${result.totalSkipped}`);
  console.log(`   Total Errors: ${result.totalErrors}`);
});

scrapingWorker.on('failed', (job, err) => {
  console.error(`\n❌ Scraping job ${job?.id} failed:`, err.message);
});

cleanupWorker.on('completed', (job, result) => {
  console.log(`\n✅ Cleanup job ${job.id} completed`);
  console.log(`   Deactivated: ${result.deactivated}`);
  console.log(`   Deleted: ${result.deleted}`);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`\n❌ Cleanup job ${job?.id} failed:`, err.message);
});

// Setup scheduled jobs
async function setupScheduledJobs() {
  console.log('🕐 Setting up scheduled jobs...');

  // Clear any existing repeatable jobs
  const scrapingRepeatableJobs = await scrapingQueue.getRepeatableJobs();
  for (const job of scrapingRepeatableJobs) {
    await scrapingQueue.removeRepeatableByKey(job.key);
  }

  const cleanupRepeatableJobs = await cleanupQueue.getRepeatableJobs();
  for (const job of cleanupRepeatableJobs) {
    await cleanupQueue.removeRepeatableByKey(job.key);
  }

  // Schedule scraping every 4 hours
  await scrapingQueue.add(
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

  // Schedule cleanup daily at 3 AM
  await cleanupQueue.add(
    'daily-cleanup',
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // Daily at 3 AM
      },
      jobId: 'scheduled-cleanup',
    }
  );
  console.log('   ✓ Scheduled "cleanup" to run daily at 3 AM');

  // Add an immediate initial scrape job if no active jobs
  const existingJobs = await scrapingQueue.getJobs(['waiting', 'active']);
  if (existingJobs.length === 0) {
    await scrapingQueue.add('initial-scrape', { scrapeAll: true }, { jobId: 'initial-scrape' });
    console.log('   ✓ Added initial scrape job');
  }
}

// CLI commands
async function handleCommand(command: string) {
  const args = command.split(' ');
  const cmd = args[0];

  switch (cmd) {
    case 'scrape-now':
      console.log('Adding immediate scrape job...');
      await scrapingQueue.add('manual-scrape', { scrapeAll: true }, { jobId: `manual-${Date.now()}` });
      break;

    case 'scrape':
      const source = args[1] as JobSource;
      if (source && AVAILABLE_SOURCES.includes(source)) {
        console.log(`Adding ${source} scrape job...`);
        await scrapingQueue.add(`manual-${source}`, { source }, { jobId: `${source}-${Date.now()}` });
      } else {
        console.log(`Unknown source. Available: ${AVAILABLE_SOURCES.join(', ')}`);
      }
      break;

    case 'cleanup':
      console.log('Adding immediate cleanup job...');
      await cleanupQueue.add('manual-cleanup', {}, { jobId: `cleanup-${Date.now()}` });
      break;

    case 'status':
      const scrapingWaiting = await scrapingQueue.getWaitingCount();
      const scrapingActive = await scrapingQueue.getActiveCount();
      const scrapingCompleted = await scrapingQueue.getCompletedCount();
      const scrapingFailed = await scrapingQueue.getFailedCount();

      const cleanupWaiting = await cleanupQueue.getWaitingCount();
      const cleanupActive = await cleanupQueue.getActiveCount();

      console.log(`\nScraping Queue Status:`);
      console.log(`  Waiting: ${scrapingWaiting}`);
      console.log(`  Active: ${scrapingActive}`);
      console.log(`  Completed: ${scrapingCompleted}`);
      console.log(`  Failed: ${scrapingFailed}`);

      console.log(`\nCleanup Queue Status:`);
      console.log(`  Waiting: ${cleanupWaiting}`);
      console.log(`  Active: ${cleanupActive}`);
      break;

    case 'sources':
      console.log(`\nAvailable sources: ${AVAILABLE_SOURCES.join(', ')}`);
      break;

    case 'help':
      console.log(`
Available commands:
  scrape-now          - Trigger immediate scrape of all sources
  scrape <source>     - Scrape specific source (${AVAILABLE_SOURCES.join(', ')})
  cleanup             - Trigger immediate cleanup
  status              - Show queue status
  sources             - List available sources
  help                - Show this help message
      `);
      break;

    default:
      console.log('Unknown command. Type "help" for available commands.');
  }
}

// Main startup
async function main() {
  console.log('🔍 Scraper service starting...');
  console.log(`📍 Connecting to Redis at ${redisHost}:${redisPort}`);
  console.log(`📋 Available sources: ${AVAILABLE_SOURCES.join(', ')}`);

  // Initialize browser on startup
  console.log('🌐 Initializing browser...');
  await browserManager.initialize();

  await setupScheduledJobs();

  console.log('\n🚀 Scraper service started and ready!');
  console.log('   Type "help" for available commands\n');

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
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);

  // Close browser
  await browserManager.close();

  // Close workers
  await scrapingWorker.close();
  await cleanupWorker.close();

  // Close queues
  await scrapingQueue.close();
  await cleanupQueue.close();

  // Close Redis
  await redis.quit();

  console.log('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
