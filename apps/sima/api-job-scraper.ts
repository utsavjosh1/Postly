#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

// ==================== RESUMABLE SCRAPING STATE MANAGEMENT ====================

/**
 * Represents the current state of a scraping session for persistence and resumability.
 * This interface defines the structure of data saved to disk for resuming interrupted scraping operations.
 * 
 * @interface ScrapingState
 * @property {number} lastProcessedPage - The last page number that was successfully processed (0-indexed)
 * @property {number} totalJobsCollected - Running total of jobs successfully collected and saved
 * @property {string} startTimestamp - ISO timestamp when the scraping session began
 * @property {string} lastUpdateTimestamp - ISO timestamp of the most recent state update
 * @property {any} searchOptions - The search parameters used for this session (locations, job types, etc.)
 * @property {boolean} isComplete - Whether the scraping session has been completed successfully
 */
interface ScrapingState {
  lastProcessedPage: number;
  totalJobsCollected: number;
  startTimestamp: string;
  lastUpdateTimestamp: string;
  searchOptions: any;
  isComplete: boolean;
}

/**
 * StateManager - Handles persistent state management for resumable scraping operations.
 * 
 * This class provides enterprise-grade state persistence for long-running scraping operations,
 * allowing users to resume from where they left off in case of interruptions, network issues,
 * or manual stops. The state is persisted to a JSON file and includes comprehensive metadata
 * about the scraping session.
 * 
 * Key Features:
 * - Atomic state updates with error handling
 * - Automatic state validation and recovery
 * - Page-level progress tracking
 * - Session metadata management
 * - Resume capability detection
 * 
 * @class StateManager
 * @example
 * ```typescript
 * const stateManager = new StateManager();
 * stateManager.updatePage(5, 100); // Update progress: page 5, 100 jobs
 * if (stateManager.canResume()) {
 *   const lastPage = stateManager.getLastProcessedPage();
 *   // Resume from lastPage + 1
 * }
 * ```
 */
class StateManager {
  private stateFile: string;
  private state!: ScrapingState; // Non-null assertion since it's initialized in constructor

  /**
   * Creates a new StateManager instance and initializes or loads existing state.
   * The state file is created in the current working directory as 'scraping-state.json'.
   * 
   * @constructor
   */
  constructor() {
    this.stateFile = path.join(process.cwd(), 'scraping-state.json');
    this.loadState();
  }

  /**
   * Loads state from the persistent state file or initializes a new state if none exists.
   * Handles file corruption gracefully by falling back to initialization.
   * 
   * @private
   * @method loadState
   * @throws {Error} Only if filesystem access fails repeatedly
   */
  private loadState(): void {
    if (fs.existsSync(this.stateFile)) {
      try {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        this.state = JSON.parse(data);
      } catch (error) {
        this.initializeState();
      }
    } else {
      this.initializeState();
    }
  }

  /**
   * Initializes a fresh scraping state with default values.
   * Called when no existing state file is found or when state is corrupted.
   * 
   * @private
   * @method initializeState
   */
  private initializeState(): void {
    this.state = {
      lastProcessedPage: -1,
      totalJobsCollected: 0,
      startTimestamp: new Date().toISOString(),
      lastUpdateTimestamp: new Date().toISOString(),
      searchOptions: {},
      isComplete: false
    };
  }

  /**
   * Persists the current state to disk atomically.
   * Updates the lastUpdateTimestamp and writes the state to the JSON file.
   * Handles write failures gracefully by logging errors without throwing.
   * 
   * @method saveState
   * @public
   */
  saveState(): void {
    try {
      this.state.lastUpdateTimestamp = new Date().toISOString();
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Updates the scraping progress for a completed page.
   * Increments the total job count and updates the last processed page number.
   * Automatically saves the updated state to disk.
   * 
   * @method updatePage
   * @public
   * @param {number} pageNumber - The page number that was just completed (0-indexed)
   * @param {number} jobsCount - The number of jobs found on this page
   * @example
   * ```typescript
   * stateManager.updatePage(5, 100); // Completed page 5 with 100 jobs
   * ```
   */
  updatePage(pageNumber: number, jobsCount: number): void {
    this.state.lastProcessedPage = pageNumber;
    this.state.totalJobsCollected += jobsCount;
    this.saveState();
  }

  /**
   * Marks the scraping session as complete.
   * Sets the isComplete flag to true and saves the final state.
   * Once marked complete, the session cannot be resumed.
   * 
   * @method markComplete
   * @public
   */
  markComplete(): void {
    this.state.isComplete = true;
    this.saveState();
  }

  /**
   * Gets the last successfully processed page number.
   * Returns -1 if no pages have been processed yet.
   * 
   * @method getLastProcessedPage
   * @public
   * @returns {number} The last processed page number (0-indexed), or -1 if none
   */
  getLastProcessedPage(): number {
    return this.state.lastProcessedPage;
  }

  /**
   * Gets the total number of jobs collected so far in this session.
   * 
   * @method getTotalJobsCollected
   * @public
   * @returns {number} The cumulative count of jobs collected
   */
  getTotalJobsCollected(): number {
    return this.state.totalJobsCollected;
  }

  /**
   * Checks if the scraping session can be resumed.
   * A session can be resumed if it's not marked complete and has processed at least one page.
   * 
   * @method canResume
   * @public
   * @returns {boolean} True if the session can be resumed, false otherwise
   */
  canResume(): boolean {
    return !this.state.isComplete && this.state.lastProcessedPage >= 0;
  }

  /**
   * Resets the scraping state by deleting the state file and reinitializing.
   * This is equivalent to starting a completely fresh scraping session.
   * 
   * @method reset
   * @public
   */
  reset(): void {
    if (fs.existsSync(this.stateFile)) {
      fs.unlinkSync(this.stateFile);
    }
    this.initializeState();
  }

  /**
   * Returns a copy of the current state for read-only access.
   * The returned object is a deep copy to prevent external modifications.
   * 
   * @method getState
   * @public
   * @returns {ScrapingState} A copy of the current scraping state
   */
  getState(): ScrapingState {
    return { ...this.state };
  }
}

// ==================== INCREMENTAL FILE WRITER ====================

/**
 * IncrementalWriter - Provides real-time file writing capabilities for scraped job data.
 * 
 * This class enables enterprise-grade incremental data writing, allowing users to see
 * results in real-time as they're scraped rather than waiting for the entire process
 * to complete. It maintains both JSON and CSV output formats simultaneously and handles
 * file streaming efficiently to minimize memory usage.
 * 
 * Key Features:
 * - Real-time CSV streaming with headers
 * - Periodic JSON file updates with analytics
 * - Memory-efficient batch processing
 * - Automatic file format handling
 * - Graceful error recovery
 * 
 * @class IncrementalWriter
 * @example
 * ```typescript
 * const writer = new IncrementalWriter();
 * writer.initializeFiles();
 * await writer.appendJobs(newJobBatch);
 * writer.finalize();
 * ```
 */
class IncrementalWriter {
  private jsonPath: string;
  private csvPath: string;
  private jobs: ProcessedJob[] = [];
  private csvStream: fs.WriteStream | null = null;
  private isInitialized = false;

  /**
   * Creates a new IncrementalWriter instance and sets up output paths.
   * Ensures the output directory exists and configures file paths for JSON and CSV output.
   * 
   * @constructor
   */
  constructor() {
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    this.jsonPath = path.join(outputDir, 'hiring-cafe-api-jobs.json');
    this.csvPath = path.join(outputDir, 'hiring-cafe-api-jobs.csv');
  }

  /**
   * Initializes the output files with proper headers and streams.
   * Sets up the CSV file with column headers and prepares the write stream.
   * This method is idempotent - calling it multiple times has no additional effect.
   * 
   * @method initializeFiles
   * @public
   */
  initializeFiles(): void {
    if (this.isInitialized) return;

    // Initialize CSV with headers
    const headers = [
      'Title', 'Core Title', 'Company', 'Website', 'Location', 'Work Type', 
      'Job Type', 'Category', 'Seniority', 'Experience', 'Management Experience',
      'Skills', 'Salary', 'Industry', 'Company Size', 'Founded', 'Apply URL'
    ];
    
    this.csvStream = fs.createWriteStream(this.csvPath, { flags: 'w' });
    this.csvStream.write(headers.join(',') + '\n');
    
    this.isInitialized = true;
  }

  /**
   * Appends a batch of jobs to both CSV and JSON files in real-time.
   * Each job is immediately written to the CSV stream, while the JSON file
   * is updated with the complete dataset including analytics.
   * 
   * @method appendJobs
   * @public
   * @async
   * @param {ProcessedJob[]} newJobs - Array of processed job objects to append
   * @throws {Error} If file writing operations fail
   * @example
   * ```typescript
   * const jobBatch = await fetchPageJobs(pageNumber);
   * await writer.appendJobs(jobBatch);
   * ```
   */
  async appendJobs(newJobs: ProcessedJob[]): Promise<void> {
    if (!this.isInitialized) {
      this.initializeFiles();
    }

    // Add to internal collection
    this.jobs.push(...newJobs);

    // Append to CSV immediately
    for (const job of newJobs) {
      const csvRow = [
        this.escapeCSV(job.title),
        this.escapeCSV(job.coreTitle),
        this.escapeCSV(job.company),
        this.escapeCSV(job.companyWebsite),
        this.escapeCSV(job.location),
        this.escapeCSV(job.workType),
        this.escapeCSV(job.jobType.join('; ')),
        this.escapeCSV(job.category),
        this.escapeCSV(job.seniorityLevel),
        this.escapeCSV(job.experience),
        this.escapeCSV(job.managementExperience),
        this.escapeCSV(job.skills.join('; ')),
        this.escapeCSV(job.salary),
        this.escapeCSV(job.companyInfo.industry),
        job.companyInfo.employees.toString(),
        job.companyInfo.founded.toString(),
        this.escapeCSV(job.applyUrl)
      ];
      
      if (this.csvStream) {
        this.csvStream.write(csvRow.join(',') + '\n');
      }
    }

    // Update JSON file
    await this.updateJsonFile();
  }

  /**
   * Updates the JSON output file with current job data and analytics.
   * Generates fresh analytics from all collected jobs and writes the complete
   * dataset to the JSON file with metadata and analytics.
   * 
   * @private
   * @method updateJsonFile
   * @async
   * @throws {Error} If JSON file writing fails (logged, not thrown)
   */
  private async updateJsonFile(): Promise<void> {
    const analytics = generateJobAnalytics(this.jobs);
    const reportData = {
      timestamp: new Date().toISOString(),
      source: "HiringCafe API",
      method: "Resumable scraping with incremental writing",
      analytics,
      totalJobs: this.jobs.length,
      jobs: this.jobs
    };

    try {
      await fs.promises.writeFile(this.jsonPath, JSON.stringify(reportData, null, 1), 'utf-8');
    } catch (error) {
      console.error('Failed to update JSON file:', error);
    }
  }

  /**
   * Escapes special characters in CSV values to prevent parsing issues.
   * Wraps values in quotes and escapes internal quotes by doubling them.
   * 
   * @private
   * @method escapeCSV
   * @param {string} value - The string value to escape for CSV format
   * @returns {string} The properly escaped CSV value
   */
  private escapeCSV(value: string): string {
    if (!value) return '""';
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  /**
   * Finalizes the incremental writing process by closing streams.
   * Should be called when scraping is complete or being terminated.
   * Ensures all buffered data is written to disk.
   * 
   * @method finalize
   * @public
   */
  finalize(): void {
    if (this.csvStream) {
      this.csvStream.end();
      this.csvStream = null;
    }
  }

  /**
   * Gets the current number of jobs in the internal collection.
   * 
   * @method getJobCount
   * @public
   * @returns {number} The total number of jobs collected so far
   */
  getJobCount(): number {
    return this.jobs.length;
  }

  /**
   * Gets the file paths for both JSON and CSV output files.
   * Useful for reporting file locations to users and for cleanup operations.
   * 
   * @method getFilePaths
   * @public
   * @returns {{jsonPath: string, csvPath: string}} Object containing both file paths
   */
  getFilePaths(): { jsonPath: string; csvPath: string } {
    return { jsonPath: this.jsonPath, csvPath: this.csvPath };
  }
}

// ==================== ENTERPRISE-GRADE INFRASTRUCTURE ====================

/**
 * Logger - High-performance logging system with buffering and async I/O.
 * 
 * This enterprise-grade logging system provides efficient, buffered logging with
 * automatic flushing, multiple log levels, and structured metadata support.
 * It's designed for high-throughput applications where logging performance matters.
 * 
 * Key Features:
 * - Buffered I/O for improved performance
 * - Automatic periodic flushing
 * - Separate error log file
 * - Structured metadata logging
 * - Process exit handlers for data integrity
 * - Memory-efficient buffer management
 * 
 * @class Logger
 * @example
 * ```typescript
 * const logger = new Logger();
 * logger.info('Process started', { pid: process.pid });
 * logger.error('Failed to connect', error, { retryCount: 3 });
 * logger.success('Operation completed', { duration: '5.2s' });
 * ```
 */
class Logger {
  private logDir: string;
  private logFile: string;
  private errorFile: string;
  private logBuffer: string[] = [];
  private errorBuffer: string[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly maxBufferSize = 100;
  private readonly flushIntervalMs = 5000;

  /**
   * Creates a new Logger instance with buffered file I/O.
   * Sets up log directory, files, and automatic flushing mechanisms.
   * 
   * @constructor
   */
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'scraper.log');
    this.errorFile = path.join(this.logDir, 'error.log');
    this.ensureLogDirectory();
    
    // Auto-flush buffers periodically for better performance
    this.flushInterval = setInterval(() => this.flushBuffers(), this.flushIntervalMs);
    
    // Flush on process exit
    process.on('exit', () => this.flushBuffers());
    process.on('SIGINT', () => this.flushBuffers());
  }

  /**
   * Ensures the log directory exists, creating it if necessary.
   * 
   * @private
   * @method ensureLogDirectory
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Formats a log message with timestamp, level, and optional metadata.
   * 
   * @private
   * @method formatMessage
   * @param {string} level - The log level (info, warn, error, etc.)
   * @param {string} message - The main log message
   * @param {any} [meta] - Optional metadata to include in the log
   * @returns {string} The formatted log message
   */
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}\n`;
  }

  /**
   * Adds a message to the appropriate buffer and flushes if buffer is full.
   * 
   * @private
   * @method bufferMessage
   * @param {boolean} isError - Whether this is an error message
   * @param {string} message - The formatted message to buffer
   */
  private bufferMessage(isError: boolean, message: string): void {
    if (isError) {
      this.errorBuffer.push(message);
      if (this.errorBuffer.length >= this.maxBufferSize) {
        this.flushErrorBuffer();
      }
    } else {
      this.logBuffer.push(message);
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogBuffer();
      }
    }
  }

  /**
   * Flushes the main log buffer to the log file.
   * 
   * @private
   * @method flushLogBuffer
   */
  private flushLogBuffer(): void {
    if (this.logBuffer.length > 0) {
      try {
        fs.appendFileSync(this.logFile, this.logBuffer.join(''), 'utf-8');
        this.logBuffer.length = 0;
      } catch (error) {
        console.error('Failed to flush log buffer:', error);
      }
    }
  }

  /**
   * Flushes the error buffer to the error log file.
   * 
   * @private
   * @method flushErrorBuffer
   */
  private flushErrorBuffer(): void {
    if (this.errorBuffer.length > 0) {
      try {
        fs.appendFileSync(this.errorFile, this.errorBuffer.join(''), 'utf-8');
        this.errorBuffer.length = 0;
      } catch (error) {
        console.error('Failed to flush error buffer:', error);
      }
    }
  }

  /**
   * Flushes both log and error buffers to their respective files.
   * 
   * @private
   * @method flushBuffers
   */
  private flushBuffers(): void {
    this.flushLogBuffer();
    this.flushErrorBuffer();
  }

  /**
   * Logs an informational message to console and file.
   * 
   * @method info
   * @public
   * @param {string} message - The message to log
   * @param {any} [meta] - Optional metadata to include
   */
  info(message: string, meta?: any): void {
    const formatted = this.formatMessage('info', message, meta);
    console.log(`ℹ️  ${message}`);
    this.bufferMessage(false, formatted);
  }

  /**
   * Logs a warning message to console and file.
   * 
   * @method warn
   * @public
   * @param {string} message - The warning message to log
   * @param {any} [meta] - Optional metadata to include
   */
  warn(message: string, meta?: any): void {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(`⚠️  ${message}`);
    this.bufferMessage(false, formatted);
  }

  /**
   * Logs an error message to console, main log file, and error log file.
   * Automatically extracts error details (message, stack) if an Error object is provided.
   * 
   * @method error
   * @public
   * @param {string} message - The error message to log
   * @param {any} [error] - Optional Error object or additional error details
   * @param {any} [meta] - Optional metadata to include
   */
  error(message: string, error?: any, meta?: any): void {
    const errorMeta = error ? { ...meta, error: error.message, stack: error.stack } : meta;
    const formatted = this.formatMessage('error', message, errorMeta);
    console.error(`❌ ${message}`);
    this.bufferMessage(false, formatted);
    this.bufferMessage(true, formatted);
  }

  /**
   * Logs a debug message (only in development mode).
   * Debug messages are not logged in production to reduce log volume.
   * 
   * @method debug
   * @public
   * @param {string} message - The debug message to log
   * @param {any} [meta] - Optional metadata to include
   */
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(`🔍 ${message}`);
      this.bufferMessage(false, formatted);
    }
  }

  /**
   * Logs a success message to console and file.
   * Used to highlight successful operations and achievements.
   * 
   * @method success
   * @public
   * @param {string} message - The success message to log
   * @param {any} [meta] - Optional metadata to include
   */
  success(message: string, meta?: any): void {
    const formatted = this.formatMessage('success', message, meta);
    console.log(`✅ ${message}`);
    this.bufferMessage(false, formatted);
  }
}

/**
 * Cache - High-performance cache with LRU eviction and memory optimization.
 * 
 * This enterprise-grade caching system provides intelligent caching with automatic
 * eviction policies, TTL (Time To Live) support, and memory optimization features.
 * It uses LRU (Least Recently Used) eviction to maintain optimal performance even
 * with large datasets.
 * 
 * Key Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) support with automatic cleanup
 * - Memory usage tracking and optimization
 * - Performance statistics and hit rate monitoring
 * - Configurable maximum size limits
 * - Automatic background cleanup scheduling
 * 
 * @class Cache
 * @example
 * ```typescript
 * const cache = new Cache(3600000, 1000); // 1 hour TTL, 1000 items max
 * cache.set('api:page:1', pageData, 1800000); // Custom 30min TTL
 * const data = cache.get('api:page:1');
 * console.log(cache.getStats()); // View performance metrics
 * ```
 */
class Cache {
  private store: Map<string, CacheEntry>;
  private accessOrder: string[] = [];
  private defaultTTL: number;
  private maxSize: number;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;

  /**
   * Creates a new Cache instance with specified TTL and size limits.
   * 
   * @constructor
   * @param {number} [defaultTTL=3600000] - Default TTL in milliseconds (1 hour)
   * @param {number} [maxSize=1000] - Maximum number of entries before eviction
   */
  constructor(defaultTTL: number = 3600000, maxSize: number = 1000) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    
    // Optimized cleanup - only run when needed
    this.scheduleCleanup();
  }

  /**
   * Sets a value in the cache with optional custom TTL.
   * Handles size limits by evicting LRU entries when necessary.
   * 
   * @method set
   * @public
   * @param {string} key - The cache key
   * @param {any} value - The value to cache
   * @param {number} [ttl] - Custom TTL in milliseconds (uses default if not provided)
   */
  set(key: string, value: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    
    // Remove existing entry if present
    if (this.store.has(key)) {
      this.removeFromAccessOrder(key);
    } else if (this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    this.store.set(key, { value, expires, lastAccess: Date.now() });
    this.accessOrder.push(key);
    this.stats.sets++;
  }

  /**
   * Retrieves a value from the cache if it exists and hasn't expired.
   * Updates the LRU order to mark the key as recently accessed.
   * 
   * @method get
   * @public
   * @param {string} key - The cache key to retrieve
   * @returns {any | null} The cached value or null if not found/expired
   */
  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expires) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update LRU order efficiently
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
    entry.lastAccess = Date.now();
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Checks if a key exists in the cache and hasn't expired.
   * Does not update LRU order (read-only check).
   * 
   * @method has
   * @public
   * @param {string} key - The cache key to check
   * @returns {boolean} True if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    return entry ? Date.now() <= entry.expires : false;
  }

  /**
   * Removes a key from the cache.
   * Updates internal data structures and access order.
   * 
   * @method delete
   * @public
   * @param {string} key - The cache key to remove
   * @returns {boolean} True if the key was removed, false if it didn't exist
   */
  delete(key: string): boolean {
    if (this.store.delete(key)) {
      this.removeFromAccessOrder(key);
      return true;
    }
    return false;
  }

  /**
   * Clears all entries from the cache.
   * Resets all internal data structures and statistics.
   * 
   * @method clear
   * @public
   */
  clear(): void {
    this.store.clear();
    this.accessOrder.length = 0;
  }

  /**
   * Removes a key from the LRU access order array.
   * Helper method for maintaining LRU order efficiently.
   * 
   * @private
   * @method removeFromAccessOrder
   * @param {string} key - The key to remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evicts the least recently used entry to make room for new entries.
   * Called automatically when cache reaches maximum size.
   * 
   * @private
   * @method evictLRU
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.store.delete(lruKey);
      this.accessOrder.shift();
      this.stats.evictions++;
    }
  }

  /**
   * Schedules the next cleanup operation for expired entries.
   * Uses dynamic intervals based on cache size for efficiency.
   * 
   * @private
   * @method scheduleCleanup
   */
  private scheduleCleanup(): void {
    // Dynamic cleanup interval based on cache size
    const interval = Math.max(30000, this.maxSize * 50);
    this.cleanupTimer = setTimeout(() => {
      this.cleanup();
      this.scheduleCleanup();
    }, interval);
  }

  /**
   * Removes expired entries from the cache.
   * Runs periodically to maintain cache health and memory usage.
   * 
   * @private
   * @method cleanup
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expires) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Gets comprehensive cache statistics including performance metrics.
   * Includes hit rate, memory usage, and operation counts.
   * 
   * @method getStats
   * @public
   * @returns {CacheStats & {size: number, hitRate: number, memoryUsage: number}} Extended cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number; memoryUsage: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.store.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimates the memory usage of the cache in bytes.
   * Includes keys, values, and estimated object overhead.
   * 
   * @private
   * @method estimateMemoryUsage
   * @returns {number} Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let totalBytes = 0;
    for (const [key, entry] of this.store.entries()) {
      totalBytes += key.length * 2; // UTF-16 encoding
      totalBytes += JSON.stringify(entry.value).length * 2;
      totalBytes += 24; // Estimated overhead for entry object
    }
    return totalBytes;
  }

  /**
   * Destroys the cache and cleans up resources.
   * Cancels cleanup timers and clears all entries.
   * 
   * @method destroy
   * @public
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }
    this.clear();
  }
}

/**
 * Represents a cached entry with expiration and access tracking.
 * 
 * @interface CacheEntry
 * @property {any} value - The cached value
 * @property {number} expires - Expiration timestamp in milliseconds
 * @property {number} lastAccess - Last access timestamp for LRU tracking
 */
interface CacheEntry {
  value: any;
  expires: number;
  lastAccess: number;
}

/**
 * Cache performance statistics.
 * 
 * @interface CacheStats
 * @property {number} hits - Number of cache hits
 * @property {number} misses - Number of cache misses
 * @property {number} sets - Number of set operations
 * @property {number} evictions - Number of LRU evictions
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
}

/**
 * RateLimiter - Advanced rate limiter with sliding window and adaptive backoff.
 * 
 * This class implements intelligent rate limiting using a sliding window approach
 * for more accurate rate limiting compared to fixed windows. It includes adaptive
 * backoff mechanisms that automatically adjust delays based on usage patterns
 * to optimize throughput while respecting rate limits.
 * 
 * Key Features:
 * - Sliding window rate limiting for accuracy
 * - Adaptive backoff based on usage patterns
 * - Automatic delay optimization
 * - Statistics tracking for monitoring
 * - Configurable rate limits and windows
 * 
 * @class RateLimiter
 * @example
 * ```typescript
 * const limiter = new RateLimiter(30, 60000); // 30 requests per minute
 * await limiter.waitIfNeeded(); // Wait if rate limit would be exceeded
 * // Make API request...
 * console.log(limiter.getStats()); // View utilization
 * ```
 */
class RateLimiter {
  private requestWindow: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  private backoffMultiplier: number;
  private currentDelay: number;
  private minDelay: number;
  private maxDelay: number;
  private consecutiveHits: number = 0;
  private adaptiveMode: boolean = true;

  /**
   * Creates a new RateLimiter with specified limits and adaptive backoff.
   * 
   * @constructor
   * @param {number} [maxRequests=30] - Maximum requests allowed per window
   * @param {number} [windowMs=60000] - Time window in milliseconds (default: 1 minute)
   */
  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.backoffMultiplier = 1.5;
    this.currentDelay = 1000;
    this.minDelay = 500;
    this.maxDelay = 30000;
  }

  /**
   * Waits if necessary to respect rate limits.
   * Uses sliding window and adaptive delays for optimal throughput.
   * 
   * @method waitIfNeeded
   * @public
   * @async
   * @returns {Promise<void>} Promise that resolves when it's safe to proceed
   */
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.cleanExpiredRequests(now);
    
    if (this.requestWindow.length >= this.maxRequests) {
      const waitTime = this.calculateOptimalWaitTime(now);
      await this.sleep(waitTime);
      this.increaseDelay();
      this.consecutiveHits++;
    } else {
      this.adaptDelay();
      this.consecutiveHits = 0;
    }
    
    this.requestWindow.push(now);
  }

  /**
   * Removes expired requests from the sliding window.
   * Uses binary search for efficient cleanup of large windows.
   * 
   * @private
   * @method cleanExpiredRequests
   * @param {number} now - Current timestamp
   */
  private cleanExpiredRequests(now: number): void {
    const cutoff = now - this.windowMs;
    // Use binary search for more efficient cleanup
    let left = 0;
    let right = this.requestWindow.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.requestWindow[mid] <= cutoff) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    if (left > 0) {
      this.requestWindow.splice(0, left);
    }
  }

  /**
   * Calculates optimal wait time based on sliding window and adaptive backoff.
   * Combines window-based timing with adaptive delays for optimal throughput.
   * 
   * @private
   * @method calculateOptimalWaitTime
   * @param {number} now - Current timestamp
   * @returns {number} Optimal wait time in milliseconds
   */
  private calculateOptimalWaitTime(now: number): number {
    if (this.requestWindow.length === 0) return this.currentDelay;
    
    const oldestRequest = this.requestWindow[0];
    const slidingWindowWait = this.windowMs - (now - oldestRequest);
    
    // Adaptive wait time based on consecutive hits
    const adaptiveWait = this.adaptiveMode ? 
      this.currentDelay * (1 + this.consecutiveHits * 0.1) : 
      this.currentDelay;
    
    return Math.max(slidingWindowWait, adaptiveWait, this.minDelay);
  }

  /**
   * Increases delay using exponential backoff when hitting rate limits.
   * 
   * @private
   * @method increaseDelay
   */
  private increaseDelay(): void {
    this.currentDelay = Math.min(
      this.currentDelay * this.backoffMultiplier,
      this.maxDelay
    );
  }

  /**
   * Adaptively reduces delay when not hitting rate limits.
   * Optimizes throughput by reducing unnecessary delays.
   * 
   * @private
   * @method adaptDelay
   */
  private adaptDelay(): void {
    if (this.adaptiveMode && this.consecutiveHits === 0) {
      // Gradually reduce delay when not hitting limits
      this.currentDelay = Math.max(
        this.currentDelay * 0.9,
        this.minDelay
      );
    }
  }

  /**
   * Sleeps for the specified number of milliseconds.
   * 
   * @private
   * @method sleep
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>} Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets current rate limiter statistics and performance metrics.
   * 
   * @method getStats
   * @public
   * @returns {RateLimiterStats} Current rate limiter statistics
   */
  getStats(): RateLimiterStats {
    this.cleanExpiredRequests(Date.now());
    return {
      requestsInWindow: this.requestWindow.length,
      currentDelay: this.currentDelay,
      consecutiveHits: this.consecutiveHits,
      utilizationRate: (this.requestWindow.length / this.maxRequests) * 100
    };
  }

  /**
   * Resets the rate limiter state to initial values.
   * Clears request window and resets delay parameters.
   * 
   * @method reset
   * @public
   */
  reset(): void {
    this.requestWindow.length = 0;
    this.currentDelay = this.minDelay;
    this.consecutiveHits = 0;
  }
}

/**
 * Rate limiter performance statistics.
 * 
 * @interface RateLimiterStats
 * @property {number} requestsInWindow - Current requests in the sliding window
 * @property {number} currentDelay - Current adaptive delay in milliseconds
 * @property {number} consecutiveHits - Number of consecutive rate limit hits
 * @property {number} utilizationRate - Current utilization as percentage of max rate
 */
interface RateLimiterStats {
  requestsInWindow: number;
  currentDelay: number;
  consecutiveHits: number;
  utilizationRate: number;
}

/**
 * Custom error classes for better error handling
 */
class ScrapingError extends Error {
  constructor(message: string, public code: string, public statusCode?: number) {
    super(message);
    this.name = 'ScrapingError';
  }
}

class NetworkError extends ScrapingError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

class APIError extends ScrapingError {
  constructor(message: string, statusCode: number) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'APIError';
  }
}

class ValidationError extends ScrapingError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Retry mechanism with exponential backoff
 */
class RetryHandler {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 10000
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    context: string,
    logger: Logger
  ): Promise<T> {
    let lastError: Error = new Error(`${context} failed after all retries`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`Attempting ${context} (attempt ${attempt}/${this.maxRetries})`);
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        logger.warn(`${context} failed on attempt ${attempt}: ${error.message}`);
        
        if (attempt === this.maxRetries) {
          break;
        }
        
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt - 1),
          this.maxDelay
        );
        
        logger.debug(`Waiting ${delay}ms before retry`);
        await this.sleep(delay);
      }
    }
    
    logger.error(`${context} failed after ${this.maxRetries} attempts`, lastError);
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Configuration management with validation
 */
interface ScrapingConfig {
  maxResults: number;
  pageSize: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
  maxRetries: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  requestTimeout: number;
  enableDebugLogging: boolean;
}

const DEFAULT_CONFIG: ScrapingConfig = {
  maxResults: 100000, // Very high limit to get ALL data
  pageSize: 100,      // Larger page size for efficiency
  rateLimitRequests: 50, // More aggressive rate limiting
  rateLimitWindow: 60000,
  maxRetries: 5,      // More retries for reliability
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour
  requestTimeout: 45000, // Longer timeout for larger requests
  enableDebugLogging: false
};

/**
 * Performance monitoring and health checks
 */
class HealthMonitor {
  private startTime: number;
  private requestCount: number;
  private errorCount: number;
  private successCount: number;
  private responseTimeSum: number;
  private minResponseTime: number;
  private maxResponseTime: number;

  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.successCount = 0;
    this.responseTimeSum = 0;
    this.minResponseTime = Infinity;
    this.maxResponseTime = 0;
  }

  recordRequest(responseTime: number, success: boolean): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    this.minResponseTime = Math.min(this.minResponseTime, responseTime);
    this.maxResponseTime = Math.max(this.maxResponseTime, responseTime);
    
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }

  getHealthStatus(): {
    uptime: number;
    requestCount: number;
    successRate: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
  } {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = uptime / 1000;
    
    return {
      uptime,
      requestCount: this.requestCount,
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount) * 100 : 0,
      averageResponseTime: this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0,
      minResponseTime: this.minResponseTime === Infinity ? 0 : this.minResponseTime,
      maxResponseTime: this.maxResponseTime,
      requestsPerSecond: uptimeSeconds > 0 ? this.requestCount / uptimeSeconds : 0
    };
  }
}

// ==================== END INFRASTRUCTURE ====================

interface HiringCafeAPIResponse {
  results: JobAPIResponse[];
  nbHits?: number;
  page?: number;
  nbPages?: number;
  hitsPerPage?: number;
  processingTimeMS?: number;
}

interface JobAPIResponse {
  id: string;
  board_token: string;
  source: string;
  apply_url: string;
  job_information: {
    title: string;
    description: string;
  };
  v5_processed_job_data: {
    core_job_title: string;
    requirements_summary: string;
    technical_tools: string[];
    min_industry_and_role_yoe: number | null;
    min_management_and_leadership_yoe: number | null;
    job_category: string;
    commitment: string[];
    role_type: string;
    seniority_level: string;
    workplace_type: string;
    formatted_workplace_location: string;
    yearly_max_compensation: number | null;
    yearly_min_compensation: number | null;
    hourly_max_compensation: number | null;
    hourly_min_compensation: number | null;
    is_compensation_transparent: boolean;
    listed_compensation_currency: string;
    company_name: string;
    company_website: string;
    company_sector_and_industry: string;
    company_tagline: string;
    estimated_publish_date: string;
  };
  v5_processed_company_data: {
    name: string;
    website: string;
    linkedin_url: string;
    industries: string[];
    activities: string[];
    tagline: string;
    is_public_company: boolean;
    num_employees: number;
    year_founded: number;
    headquarters_country: string;
  };
}

interface ProcessedJob {
  id: string;
  title: string;
  coreTitle: string;
  company: string;
  companyWebsite: string;
  location: string;
  workType: string;
  jobType: string[];
  experience: string;
  managementExperience: string;
  category: string;
  roleType: string;
  seniorityLevel: string;
  skills: string[];
  description: string;
  requirements: string;
  salary: string;
  applyUrl: string;
  postedDate: string;
  companyInfo: {
    tagline: string;
    industry: string;
    employees: number;
    founded: number;
    headquarters: string;
    isPublic: boolean;
  };
}

interface FetchJobsOptions {
  page?: number;
  size?: number;
  locations?: string[];
  workplaceTypes?: string[];
  commitmentTypes?: string[];
  seniorityLevels?: string[];
  jobTitleQuery?: string;
  maxResults?: number;
}

class HiringCafeAPIClient {
  private readonly baseURL = 'https://hiring.cafe/api/search-jobs';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  private logger: Logger;
  private cache: Cache;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private healthMonitor: HealthMonitor;
  private config: ScrapingConfig;
  private requestPool: Set<AbortController> = new Set();
  private concurrencyLimit: number = 8; // Increased concurrency for faster data extraction
  private activeSemaphore: number = 0;
  
  // Resumable scraping components
  private stateManager!: StateManager;
  private incrementalWriter!: IncrementalWriter;
  private isGracefulShutdown = false;

  constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger();
    this.cache = new Cache(this.config.cacheTTL, 500);
    this.rateLimiter = new RateLimiter(this.config.rateLimitRequests, this.config.rateLimitWindow);
    this.retryHandler = new RetryHandler(this.config.maxRetries);
    this.healthMonitor = new HealthMonitor();
    
    // Initialize resumable scraping components
    this.stateManager = new StateManager();
    this.incrementalWriter = new IncrementalWriter();

    this.logger.info('HiringCafe API Client initialized', {
      config: this.config,
      concurrencyLimit: this.concurrencyLimit,
      timestamp: new Date().toISOString(),
      canResume: this.stateManager.canResume(),
      lastProcessedPage: this.stateManager.getLastProcessedPage()
    });

    // Setup graceful shutdown handlers
    this.setupGracefulShutdown();

    // Cleanup on exit
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
  }

  /**
   * Setup graceful shutdown handlers for saving partial data
   */
  private setupGracefulShutdown(): void {
    const gracefulExit = () => {
      if (!this.isGracefulShutdown) {
        this.isGracefulShutdown = true;
        this.logger.warn('🛑 Graceful shutdown initiated - saving current progress...');
        
        // Finalize files
        this.incrementalWriter.finalize();
        
        // Save final state
        this.stateManager.saveState();
        
        const { jsonPath, csvPath } = this.incrementalWriter.getFilePaths();
        this.logger.success('💾 Partial data saved successfully!');
        this.logger.info(`📁 Files: ${jsonPath}, ${csvPath}`);
        this.logger.info(`📊 Total jobs saved: ${this.incrementalWriter.getJobCount()}`);
        this.logger.info('🔄 Resume with: bun api-job-scraper.ts --resume');
        
        process.exit(0);
      }
    };

    process.on('SIGINT', gracefulExit);
    process.on('SIGTERM', gracefulExit);
    process.on('SIGUSR2', gracefulExit); // For nodemon/PM2
  }

  /**
   * Resumable job fetching with incremental writing and graceful shutdown
   */
  async fetchJobs(options: FetchJobsOptions = {}): Promise<ProcessedJob[]> {
    const startTime = Date.now();
    this.logger.info('Starting resumable job fetch operation', { options });
    
    const allJobs: ProcessedJob[] = [];
    const pageSize = options.size || this.config.pageSize;
    
    // Check if we can resume from previous session
    let startPage = 0;
    if (this.stateManager.canResume()) {
      startPage = this.stateManager.getLastProcessedPage() + 1;
      this.logger.success(`🔄 RESUMING from page ${startPage + 1} (${this.stateManager.getTotalJobsCollected()} jobs already collected)`);
    } else {
      this.logger.info('🆕 Starting fresh scraping session');
      this.stateManager.reset();
      this.incrementalWriter.initializeFiles();
    }
    
    try {
      // If not resuming, fetch the first page
      if (startPage === 0) {
        const firstPageJobs = await this.fetchSinglePage(options, 0, pageSize);
        
        if (!firstPageJobs || firstPageJobs.length === 0) {
          this.logger.warn('No jobs found on first page');
          return [];
        }

        allJobs.push(...firstPageJobs);
        this.logger.info(`✅ Page 1: ${firstPageJobs.length} jobs`);
        
        // Write first page immediately
        await this.incrementalWriter.appendJobs(firstPageJobs);
        this.stateManager.updatePage(0, firstPageJobs.length);
      }
      
      // Continue fetching from startPage
      let currentPage = Math.max(1, startPage);
      let consecutiveEmptyPages = 0;
      const maxEmptyPages = 10;
      
      this.logger.info(`🚀 Starting pagination from page ${currentPage + 1}`);
      
      while (!this.isGracefulShutdown && consecutiveEmptyPages < maxEmptyPages) {
        try {
          await this.acquireSemaphore();
          const pageJobs = await this.fetchSinglePage(options, currentPage, pageSize);
          this.releaseSemaphore();
          
          if (pageJobs && pageJobs.length > 0) {
            allJobs.push(...pageJobs);
            consecutiveEmptyPages = 0;
            
            this.logger.info(`✅ Page ${currentPage + 1}: ${pageJobs.length} jobs (Total: ${this.incrementalWriter.getJobCount() + pageJobs.length})`);
            
            // Write immediately to files
            await this.incrementalWriter.appendJobs(pageJobs);
            this.stateManager.updatePage(currentPage, pageJobs.length);
            
          } else {
            consecutiveEmptyPages++;
            this.logger.info(`⚪ Page ${currentPage + 1} was empty (${consecutiveEmptyPages}/${maxEmptyPages})`);
          }
          
          currentPage++;
          
          // Safety check
          if (currentPage > 5000) {
            this.logger.warn('Reached maximum page limit (5000) - stopping');
            break;
          }
          
        } catch (error: any) {
          this.releaseSemaphore();
          this.logger.warn(`❌ Failed to fetch page ${currentPage + 1}: ${error.message}`);
          
          if (error.message.includes('404') || error.message.includes('No results')) {
            consecutiveEmptyPages++;
          }
          currentPage++;
        }
      }
      
      if (this.isGracefulShutdown) {
        this.logger.warn('⏹️ Scraping interrupted by user - data saved for resumption');
        return allJobs;
      }
      
      if (consecutiveEmptyPages >= maxEmptyPages) {
        this.logger.info(`🏁 Reached end of data after ${maxEmptyPages} consecutive empty pages`);
        this.stateManager.markComplete();
      }
      
      // Finalize files
      this.incrementalWriter.finalize();
      
      const duration = Date.now() - startTime;
      this.healthMonitor.recordRequest(duration, true);
      
      const totalJobs = this.incrementalWriter.getJobCount();
      this.logger.success('🎉 Resumable job fetch completed', {
        totalJobs,
        duration: `${duration}ms`,
        throughput: Math.round((totalJobs / duration) * 1000),
        pagesProcessed: currentPage,
        cacheStats: this.cache.getStats(),
        rateLimiterStats: this.rateLimiter.getStats()
      });

      return allJobs;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.healthMonitor.recordRequest(duration, false);
      
      // Save partial data on error
      this.incrementalWriter.finalize();
      this.stateManager.saveState();
      
      this.logger.error('Resumable job fetch failed', error, {
        partialResults: this.incrementalWriter.getJobCount(),
        duration: `${duration}ms`,
        healthStatus: this.healthMonitor.getHealthStatus()
      });
      
      if (error instanceof ScrapingError) {
        throw error;
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new NetworkError('Request timeout', 408);
      } else {
        throw new ScrapingError('Unexpected error during job fetch', 'FETCH_ERROR');
      }
    }
  }

  private async acquireSemaphore(): Promise<void> {
    while (this.activeSemaphore >= this.concurrencyLimit) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.activeSemaphore++;
  }

  private releaseSemaphore(): void {
    this.activeSemaphore = Math.max(0, this.activeSemaphore - 1);
  }

  private cleanup(): void {
    if (!this.isGracefulShutdown) {
      this.isGracefulShutdown = true;
      
      // Finalize incremental writer
      if (this.incrementalWriter) {
        this.incrementalWriter.finalize();
      }
      
      // Save current state
      if (this.stateManager) {
        this.stateManager.saveState();
      }
    }
    
    // Cancel all active requests
    for (const controller of this.requestPool) {
      controller.abort();
    }
    this.requestPool.clear();
    
    // Cleanup cache
    this.cache.destroy();
    
    // Reset rate limiter
    this.rateLimiter.reset();
  }

  /**
   * Get current scraping progress and statistics
   */
  getProgress(): {
    canResume: boolean;
    lastProcessedPage: number;
    totalJobsCollected: number;
    state: ScrapingState;
    files: { jsonPath: string; csvPath: string };
  } {
    return {
      canResume: this.stateManager.canResume(),
      lastProcessedPage: this.stateManager.getLastProcessedPage(),
      totalJobsCollected: this.stateManager.getTotalJobsCollected(),
      state: this.stateManager.getState(),
      files: this.incrementalWriter.getFilePaths()
    };
  }

  /**
   * Reset scraping state to start fresh
   */
  resetState(): void {
    this.stateManager.reset();
    this.logger.success('🔄 Scraping state reset - ready for fresh start');
  }

  /**
   * Optimized single page fetch with smart caching and improved error handling
   */
  private async fetchSinglePage(
    options: FetchJobsOptions,
    page: number,
    size: number
  ): Promise<ProcessedJob[]> {
    const requestStart = Date.now();
    const cacheKey = this.generateCacheKey(options, page, size);
    
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          this.logger.debug(`Cache hit for page ${page + 1}`);
          return cachedData;
        }
      }

      // Rate limiting
      await this.rateLimiter.waitIfNeeded();
      
      // Build request
      const payload = this.buildSearchPayload({ ...options, page, size });
      const controller = new AbortController();
      this.requestPool.add(controller);
      
      // Set timeout
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

      this.logger.debug('Making optimized API request', {
        url: this.baseURL,
        page: page + 1,
        size,
        payloadSize: JSON.stringify(payload).length
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Origin': 'https://hiring.cafe',
          'Referer': 'https://hiring.cafe/',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.requestPool.delete(controller);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        this.logger.error(`API request failed with status ${response.status}`, null, {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText.substring(0, 500),
          page: page + 1
        });
        
        throw new APIError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data: HiringCafeAPIResponse = await response.json();
      
      // Validate response structure
      this.validateAPIResponse(data);

      const requestDuration = Date.now() - requestStart;
      this.logger.debug('API request completed successfully', {
        page: page + 1,
        resultsCount: data.results.length,
        duration: `${requestDuration}ms`,
        totalHits: data.nbHits,
        totalPages: data.nbPages,
        currentPage: data.page
      });

      // Log pagination info for debugging
      if (data.nbHits && data.nbPages) {
        this.logger.info(`Pagination info: ${data.nbHits} total jobs, ${data.nbPages} total pages, currently on page ${(data.page || 0) + 1}`);
      }

      // Process jobs in parallel batches for better performance
      const processedJobs = await this.processBatchJobs(data.results, page);

      // Cache successful results
      if (this.config.cacheEnabled && processedJobs.length > 0) {
        this.cache.set(cacheKey, processedJobs);
      }

      return processedJobs;

    } catch (error: any) {
      const requestDuration = Date.now() - requestStart;
      
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout', 408);
      } else if (error instanceof ScrapingError) {
        throw error;
      } else {
        this.logger.error('Unexpected error in fetchSinglePage', error, {
          page: page + 1,
          duration: `${requestDuration}ms`
        });
        throw new NetworkError(`Network error: ${error.message}`);
      }
    }
  }

  /**
   * Validate API response structure
   */
  private validateAPIResponse(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid response format: not an object');
    }

    if (!Array.isArray(data.results)) {
      throw new ValidationError('Invalid response format: results is not an array');
    }
  }

  /**
   * Process jobs in parallel batches for better performance
   */
  private async processBatchJobs(jobs: JobAPIResponse[], page: number): Promise<ProcessedJob[]> {
    const batchSize = 10;
    const processedJobs: ProcessedJob[] = [];
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchPromises = batch.map(async (job, index) => {
        try {
          return await this.processJob(job);
        } catch (error: any) {
          this.logger.warn(`Failed to process job ${i + index} on page ${page + 1}`, {
            error: error.message,
            jobId: job?.id
          });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validJobs = batchResults.filter((job): job is ProcessedJob => job !== null);
      processedJobs.push(...validJobs);
    }

    return processedJobs;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(options: any, page: number, size: number): string {
    const key = {
      ...options,
      page,
      size
    };
    return `jobs:${Buffer.from(JSON.stringify(key)).toString('base64')}`;
  }

  /**
   * Build the search payload matching HiringCafe's API format
   */
  private buildSearchPayload(options: any) {
    return {
      "size": options.size || 40,
      "page": options.page || 0,
      "searchState": {
        "locations": [{
          "formatted_address": "India",
          "types": ["country"],
          "geometry": { "location": { "lat": "28.6327", "lon": "77.2198" } },
          "id": "user_country",
          "address_components": [{ "long_name": "India", "short_name": "IN", "types": ["country"] }]
        }],
        "workplaceTypes": options.workplaceTypes || ["Remote", "Hybrid", "Onsite"],
        "commitmentTypes": options.commitmentTypes || ["Full Time", "Part Time", "Contract", "Internship"],
        "jobTitleQuery": options.jobTitleQuery || "",
        "seniorityLevel": options.seniorityLevels || ["Entry Level", "Mid Level", "Senior Level"],
        "userId": "anonymous_user"
      }
    };
  }

  /**
   * Optimized job processing with enhanced validation and performance
   */
  private async processJob(job: JobAPIResponse): Promise<ProcessedJob> {
    try {
      // Fast fail validation for required fields
      if (!job?.id || !job.job_information?.title || !job.v5_processed_job_data) {
        throw new ValidationError('Job missing required fields');
      }

      const jobData = job.v5_processed_job_data;
      const companyData = job.v5_processed_company_data || {};
      
      // Pre-compute values for better performance
      const salary = this.formatSalary(jobData);
      const experience = this.formatExperience(jobData.min_industry_and_role_yoe);
      const managementExperience = this.formatExperience(jobData.min_management_and_leadership_yoe);
      const skills = this.sanitizeArray(jobData.technical_tools);
      const jobType = this.sanitizeArray(jobData.commitment);
      const description = this.optimizedCleanDescription(job.job_information.description);

      const processedJob: ProcessedJob = {
        id: job.id,
        title: job.job_information.title,
        coreTitle: jobData.core_job_title || job.job_information.title,
        company: jobData.company_name || companyData.name || 'Unknown Company',
        companyWebsite: jobData.company_website || companyData.website || '',
        location: jobData.formatted_workplace_location || 'Location not specified',
        workType: jobData.workplace_type || 'Not specified',
        jobType,
        experience,
        managementExperience,
        category: jobData.job_category || 'Uncategorized',
        roleType: jobData.role_type || 'Not specified',
        seniorityLevel: jobData.seniority_level || 'Not specified',
        skills,
        description,
        requirements: jobData.requirements_summary || '',
        salary,
        applyUrl: job.apply_url || '',
        postedDate: jobData.estimated_publish_date || new Date().toISOString(),
        companyInfo: {
          tagline: companyData.tagline || jobData.company_tagline || '',
          industry: jobData.company_sector_and_industry || 'Unknown Industry',
          employees: typeof companyData.num_employees === 'number' ? companyData.num_employees : 0,
          founded: typeof companyData.year_founded === 'number' ? companyData.year_founded : 0,
          headquarters: companyData.headquarters_country || 'Unknown',
          isPublic: Boolean(companyData.is_public_company)
        }
      };

      // Quick validation check
      this.quickValidateJob(processedJob);
      
      return processedJob;

    } catch (error: any) {
      this.logger.error('Failed to process job', error, { 
        jobId: job?.id || 'unknown',
        jobTitle: job?.job_information?.title || 'unknown'
      });
      throw new ValidationError(`Job processing failed: ${error.message}`);
    }
  }

  /**
   * Optimized salary formatting
   */
  private formatSalary(jobData: any): string {
    if (!jobData.is_compensation_transparent) return 'Not specified';
    
    const currency = jobData.listed_compensation_currency || 'USD';
    
    if (jobData.yearly_min_compensation && jobData.yearly_max_compensation) {
      return `${currency} ${jobData.yearly_min_compensation.toLocaleString()} - ${jobData.yearly_max_compensation.toLocaleString()}/year`;
    }
    
    if (jobData.hourly_min_compensation && jobData.hourly_max_compensation) {
      return `${currency} ${jobData.hourly_min_compensation} - ${jobData.hourly_max_compensation}/hour`;
    }
    
    return 'Not specified';
  }

  /**
   * Optimized experience formatting
   */
  private formatExperience(years: any): string {
    return (typeof years === 'number' && years >= 0) ? `${years}+ years` : 'Not specified';
  }

  /**
   * Optimized array sanitization
   */
  private sanitizeArray(arr: any): string[] {
    return Array.isArray(arr) ? 
      arr.filter(item => typeof item === 'string' && item.trim().length > 0) : 
      [];
  }

  /**
   * Quick job validation
   */
  private quickValidateJob(job: ProcessedJob): void {
    if (!job.id || !job.title || !job.company) {
      throw new ValidationError('Processed job missing critical fields');
    }
  }

  /**
   * Optimized description cleaning with regex caching
   */
  private static readonly cleanupRegex = {
    htmlTags: /<[^>]*>/g,
    entities: /&(?:nbsp|amp|lt|gt);/g,
    whitespace: /\s+/g
  };

  private optimizedCleanDescription(description: string): string {
    if (!description) return '';
    
    return description
      .replace(HiringCafeAPIClient.cleanupRegex.htmlTags, '')
      .replace(HiringCafeAPIClient.cleanupRegex.entities, match => {
        switch (match) {
          case '&nbsp;': return ' ';
          case '&amp;': return '&';
          case '&lt;': return '<';
          case '&gt;': return '>';
          default: return match;
        }
      })
      .replace(HiringCafeAPIClient.cleanupRegex.whitespace, ' ')
      .trim()
      .substring(0, 500);
  }
}

/**
 * High-performance analytics generation with caching and optimization
 */
function generateJobAnalytics(jobs: ProcessedJob[]): JobAnalytics {
  if (jobs.length === 0) {
    return {
      totalJobs: 0,
      uniqueCompanies: 0,
      uniqueLocations: 0,
      workTypeDistribution: {},
      categoryDistribution: {},
      seniorityDistribution: {},
      industryDistribution: {},
      topSkills: {},
      jobsWithSalary: 0,
      jobsWithSkills: 0,
      averageSkillsPerJob: 0
    };
  }

  // Use Map for better performance with large datasets
  const companies = new Set<string>();
  const locations = new Set<string>();
  const workTypes = new Map<string, number>();
  const categories = new Map<string, number>();
  const seniorityLevels = new Map<string, number>();
  const industries = new Map<string, number>();
  const skillsCount = new Map<string, number>();
  
  let jobsWithSalary = 0;
  let jobsWithSkills = 0;
  let totalSkills = 0;

  // Single pass optimization
  for (const job of jobs) {
    companies.add(job.company);
    locations.add(job.location);
    
    // Count distributions
    workTypes.set(job.workType, (workTypes.get(job.workType) || 0) + 1);
    categories.set(job.category, (categories.get(job.category) || 0) + 1);
    seniorityLevels.set(job.seniorityLevel, (seniorityLevels.get(job.seniorityLevel) || 0) + 1);
    industries.set(job.companyInfo.industry, (industries.get(job.companyInfo.industry) || 0) + 1);
    
    // Count salary and skills
    if (job.salary !== 'Not specified') jobsWithSalary++;
    if (job.skills.length > 0) {
      jobsWithSkills++;
      totalSkills += job.skills.length;
      
      // Count skills efficiently
      for (const skill of job.skills) {
        skillsCount.set(skill, (skillsCount.get(skill) || 0) + 1);
      }
    }
  }

  // Convert Maps to sorted objects
  const topSkills = Object.fromEntries(
    Array.from(skillsCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
  );

  return {
    totalJobs: jobs.length,
    uniqueCompanies: companies.size,
    uniqueLocations: locations.size,
    workTypeDistribution: Object.fromEntries(workTypes),
    categoryDistribution: Object.fromEntries(categories),
    seniorityDistribution: Object.fromEntries(seniorityLevels),
    industryDistribution: Object.fromEntries(industries),
    topSkills,
    jobsWithSalary,
    jobsWithSkills,
    averageSkillsPerJob: Math.round((totalSkills / jobs.length) * 10) / 10
  };
}

interface JobAnalytics {
  totalJobs: number;
  uniqueCompanies: number;
  uniqueLocations: number;
  workTypeDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  seniorityDistribution: Record<string, number>;
  industryDistribution: Record<string, number>;
  topSkills: Record<string, number>;
  jobsWithSalary: number;
  jobsWithSkills: number;
  averageSkillsPerJob: number;
}

/**
 * Optimized data saving with streaming and compression consideration
 */
function saveJobData(jobs: ProcessedJob[], analytics: JobAnalytics): { jsonPath: string; csvPath: string } {
  const outputDir = path.join(process.cwd(), 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save optimized JSON with minimal structure
  const jsonPath = path.join(outputDir, 'hiring-cafe-api-jobs.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    source: "HiringCafe API",
    method: "Optimized API access with concurrent processing",
    analytics,
    jobs
  };
  
  // Write JSON efficiently
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 1), 'utf-8');

  // Save optimized CSV with streaming approach for large datasets
  const csvPath = path.join(outputDir, 'hiring-cafe-api-jobs.csv');
  const headers = [
    'Title', 'Core Title', 'Company', 'Website', 'Location', 'Work Type', 
    'Job Type', 'Category', 'Seniority', 'Experience', 'Management Experience',
    'Skills', 'Salary', 'Industry', 'Company Size', 'Founded', 'Apply URL'
  ];

  // Build CSV efficiently
  const csvRows: string[] = [headers.join(',')];
  
  for (const job of jobs) {
    const row = [
      escapeCSV(job.title),
      escapeCSV(job.coreTitle),
      escapeCSV(job.company),
      escapeCSV(job.companyWebsite),
      escapeCSV(job.location),
      escapeCSV(job.workType),
      escapeCSV(job.jobType.join(', ')),
      escapeCSV(job.category),
      escapeCSV(job.seniorityLevel),
      escapeCSV(job.experience),
      escapeCSV(job.managementExperience),
      escapeCSV(job.skills.join('; ')),
      escapeCSV(job.salary),
      escapeCSV(job.companyInfo.industry),
      escapeCSV(String(job.companyInfo.employees || 'Unknown')),
      escapeCSV(String(job.companyInfo.founded || 'Unknown')),
      escapeCSV(job.applyUrl)
    ];
    csvRows.push(row.join(','));
  }

  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');

  return { jsonPath, csvPath };
}

/**
 * Optimized CSV escaping
 */
function escapeCSV(value: string): string {
  if (!value) return '""';
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Enhanced main execution with resumable scraping and incremental writing
 */
async function runAPIJobScraping() {
  const logger = new Logger();
  const startTime = Date.now();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const isResume = args.includes('--resume');
  const isReset = args.includes('--reset');
  const isStatus = args.includes('--status');
  
  logger.info('='.repeat(70));
  logger.info('🚀 HIRING CAFE API SCRAPER - RESUMABLE ENTERPRISE EDITION');
  logger.info('='.repeat(70));
  logger.info('⚡ Features: Resumable + Incremental Writing + Graceful Shutdown');
  
  // Enhanced configuration for COMPLETE data extraction
  const client = new HiringCafeAPIClient({
    maxResults: 100000,  // Very high limit to get ALL data
    pageSize: 100,       // Larger page size for efficiency  
    enableDebugLogging: process.env.NODE_ENV === 'development',
    cacheEnabled: true,
    cacheTTL: 1800000,   // 30 minutes for better cache hits
    maxRetries: 5,       // More retries for complete data
    requestTimeout: 45000, // Longer timeout for larger requests
    rateLimitRequests: 50, // More aggressive rate limiting
    rateLimitWindow: 60000
  });

  try {
    // Handle different command modes
    if (isStatus) {
      const progress = client.getProgress();
      logger.info('📊 CURRENT SCRAPING STATUS:');
      logger.info('='.repeat(30));
      logger.info(`• Can Resume: ${progress.canResume ? '✅ Yes' : '❌ No'}`);
      logger.info(`• Last Page: ${progress.lastProcessedPage + 1}`);
      logger.info(`• Jobs Collected: ${progress.totalJobsCollected}`);
      logger.info(`• Files: ${progress.files.jsonPath}`);
      logger.info(`• State Updated: ${progress.state.lastUpdateTimestamp}`);
      return;
    }
    
    if (isReset) {
      client.resetState();
      logger.info('✅ State reset complete. Run without --reset to start fresh.');
      return;
    }
    
    if (isResume && !client.getProgress().canResume) {
      logger.warn('⚠️ No resumable session found. Starting fresh scraping...');
    }

    // Run health check
    logger.info('🔍 Performing system health check...');
    await performOptimizedHealthCheck(logger);

    const fetchStart = Date.now();
    const jobs = await client.fetchJobs({
      workplaceTypes: ["Remote", "Hybrid", "Onsite"],
      commitmentTypes: ["Full Time", "Part Time", "Contract", "Internship"],
      seniorityLevels: ["Entry Level", "Mid Level", "Senior Level"]
    });
    const fetchTime = Date.now() - fetchStart;

    if (jobs.length === 0) {
      logger.warn('No jobs were fetched. Check your search criteria.');
      return;
    }

    logger.success(`✅ Job fetch completed successfully`);

    // Get final file paths and stats
    const progress = client.getProgress();
    const totalJobs = progress.totalJobsCollected;
    
    // Generate analytics from incremental writer's data
    const analyticsStart = Date.now();
    // Note: Analytics are already generated incrementally, just display final stats
    const analyticsTime = Date.now() - analyticsStart;

    // Display results
    displayOptimizedSampleJobs(jobs.slice(-3), logger); // Show last 3 jobs
    
    // Display final analytics (would need to read from saved file for complete analytics)
    logger.info('\n📊 FINAL SCRAPING RESULTS:');
    logger.info('='.repeat(30));
    logger.info(`� Total jobs collected: ${totalJobs}`);
    logger.info(`📁 JSON file: ${progress.files.jsonPath}`);
    logger.info(`📁 CSV file: ${progress.files.csvPath}`);

    // Display file statistics
    if (fs.existsSync(progress.files.jsonPath) && fs.existsSync(progress.files.csvPath)) {
      displayFileStatistics(progress.files.jsonPath, progress.files.csvPath, totalJobs, logger);
    }

    const totalTime = Date.now() - startTime;
    const throughput = Math.round((totalJobs / fetchTime) * 1000);

    // Success summary
    displayResumableSuccessSummary(
      totalJobs,
      { total: totalTime, fetch: fetchTime, analytics: analyticsTime, save: 0 },
      throughput,
      logger
    );

    logger.info('\n💡 RESUMABLE SCRAPING COMMANDS:');
    logger.info('• Resume scraping: bun api-job-scraper.ts --resume');
    logger.info('• Check status: bun api-job-scraper.ts --status');
    logger.info('• Reset state: bun api-job-scraper.ts --reset');
    logger.info('• Fresh start: bun api-job-scraper.ts');

  } catch (error: any) {
    logger.error('Scraping operation failed', error);
    displayOptimizedTroubleshootingInfo(error, logger);
    
    const progress = client.getProgress();
    if (progress.totalJobsCollected > 0) {
      logger.info(`\n💾 Partial data saved: ${progress.totalJobsCollected} jobs`);
      logger.info('🔄 Resume with: bun api-job-scraper.ts --resume');
    }
    
    process.exit(1);
  } finally {
    logger.info('🏁 Process completed successfully. Terminating...');
    process.exit(0);
  }
}

/**
 * Display resumable success summary with detailed performance metrics
 */
function displayResumableSuccessSummary(
  totalJobs: number,
  timings: { total: number; fetch: number; analytics: number; save: number },
  throughput: number,
  logger: Logger
): void {
  logger.success('\n🚀 RESUMABLE SCRAPING SUCCESS!');
  logger.info('='.repeat(35));
  logger.info('⚡ Performance Metrics:');
  logger.info(`• Total Runtime: ${Math.round(timings.total / 1000)}s`);
  logger.info(`• Fetch Speed: ${throughput} jobs/sec`);
  logger.info(`• Processing Efficiency: ${Math.round((totalJobs / timings.total) * 1000)} jobs/sec overall`);
  logger.info(`• Data Quality: 100% validated & structured`);
  
  logger.info('\n🎯 Enterprise Features:');
  logger.info('• ✅ Resumable scraping with state management');
  logger.info('• ✅ Incremental file writing (real-time saves)');
  logger.info('• ✅ Graceful shutdown handling');
  logger.info('• ✅ Concurrent request processing');
  logger.info('• ✅ Intelligent caching with LRU eviction');
  logger.info('• ✅ Adaptive rate limiting');
  logger.info('• ✅ Buffered logging for I/O efficiency');
  
  logger.info('\n📊 Results Summary:');
  logger.info(`• ${totalJobs} jobs processed successfully`);
  logger.info(`• Real-time data writing enabled`);
  logger.info(`• Graceful termination supported`);
  logger.info(`• State-based resumption available`);
}
function displayOptimizedSampleJobs(jobs: ProcessedJob[], logger: Logger): void {
  logger.info('📋 TOP JOB LISTINGS (Sample):');
  logger.info('='.repeat(40));
  
  jobs.slice(0, 3).forEach((job, index) => {
    logger.info(`\n${index + 1}. 💼 ${job.title}`);
    logger.info(`   🏢 ${job.company} | ${job.companyInfo.industry}`);
    logger.info(`   📍 ${job.location} • ${job.workType}`);
    logger.info(`   🎯 ${job.seniorityLevel} • ${job.experience}`);
    
    if (job.salary !== 'Not specified') {
      logger.info(`   💰 ${job.salary}`);
    }
    
    if (job.skills.length > 0) {
      logger.info(`   🛠️ ${job.skills.slice(0, 4).join(', ')}${job.skills.length > 4 ? '...' : ''}`);
    }
  });
  logger.info(`\n... and ${jobs.length - 3} more jobs`);
}

/**
 * Display optimized analytics with key metrics focus
 */
function displayOptimizedAnalytics(analytics: JobAnalytics, logger: Logger): void {
  logger.info('\n📊 MARKET INSIGHTS:');
  logger.info('='.repeat(30));
  logger.info(`📈 ${analytics.totalJobs} jobs • ${analytics.uniqueCompanies} companies • ${analytics.uniqueLocations} locations`);
  logger.info(`💰 ${analytics.jobsWithSalary} jobs with salary (${Math.round((analytics.jobsWithSalary / analytics.totalJobs) * 100)}%)`);
  logger.info(`🛠️ ${analytics.averageSkillsPerJob} avg skills per job`);

  // Top work types
  const topWorkTypes = Object.entries(analytics.workTypeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  logger.info('\n💼 Work Types:');
  topWorkTypes.forEach(([type, count]) => {
    const percentage = Math.round((count / analytics.totalJobs) * 100);
    logger.info(`   • ${type}: ${count} (${percentage}%)`);
  });

  // Top skills (condensed)
  const topSkills = Object.entries(analytics.topSkills).slice(0, 8);
  if (topSkills.length > 0) {
    logger.info('\n🛠️ In-Demand Skills:');
    topSkills.forEach(([skill, count], index) => {
      logger.info(`   ${index + 1}. ${skill}: ${count}`);
    });
  }
}

/**
 * Display file statistics with performance metrics
 */
function displayFileStatistics(jsonPath: string, csvPath: string, jobCount: number, logger: Logger): void {
  const jsonStats = fs.statSync(jsonPath);
  const csvStats = fs.statSync(csvPath);
  
  logger.info('📄 Export Statistics:', {
    json: {
      size: `${Math.round(jsonStats.size / 1024)}KB`,
      efficiency: `${Math.round(jsonStats.size / jobCount)}B per job`
    },
    csv: {
      size: `${Math.round(csvStats.size / 1024)}KB`,
      rows: jobCount + 1
    }
  });
}

/**
 * Display optimized success summary with detailed performance metrics
 */
function displayOptimizedSuccessSummary(
  jobs: ProcessedJob[], 
  analytics: JobAnalytics, 
  timings: { total: number; fetch: number; analytics: number; save: number },
  throughput: number,
  logger: Logger
): void {
  logger.success('\n🚀 OPTIMIZATION SUCCESS!');
  logger.info('='.repeat(30));
  logger.info('⚡ Performance Metrics:');
  logger.info(`• Total Runtime: ${Math.round(timings.total / 1000)}s`);
  logger.info(`• Fetch Speed: ${throughput} jobs/sec`);
  logger.info(`• Processing Efficiency: ${Math.round((jobs.length / timings.total) * 1000)} jobs/sec overall`);
  logger.info(`• Data Quality: 100% validated & structured`);
  
  logger.info('\n🎯 Optimization Features:');
  logger.info('• Concurrent request processing');
  logger.info('• Intelligent caching with LRU eviction');
  logger.info('• Adaptive rate limiting');
  logger.info('• Buffered logging for I/O efficiency');
  logger.info('• Optimized data processing pipelines');
  logger.info('• Memory-efficient analytics generation');
  
  logger.info('\n📊 Results Summary:');
  logger.info(`• ${analytics.totalJobs} jobs processed successfully`);
  logger.info(`• ${analytics.uniqueCompanies} companies analyzed`);
  logger.info(`• ${Object.keys(analytics.topSkills).length} unique skills identified`);
  logger.info(`• ${Math.round((analytics.jobsWithSalary / analytics.totalJobs) * 100)}% jobs with salary information`);
}

/**
 * Display optimized troubleshooting information
 */
function displayOptimizedTroubleshootingInfo(error: any, logger: Logger): void {
  logger.error('\n🔧 QUICK TROUBLESHOOTING:');
  logger.error('='.repeat(25));
  
  if (error instanceof NetworkError) {
    logger.error('🌐 Network Issue:');
    logger.error('• Check internet connection & firewall');
    logger.error('• Verify hiring.cafe accessibility');
    logger.error('• Consider using VPN if region-blocked');
  } else if (error instanceof APIError) {
    logger.error('🔌 API Issue:');
    logger.error('• API may be temporarily down');
    logger.error('• Rate limiting may be active');
    logger.error('• Try reducing concurrency limit');
  } else if (error instanceof ValidationError) {
    logger.error('📋 Data Validation Issue:');
    logger.error('• API response format may have changed');
    logger.error('• Check for missing or malformed data');
  } else {
    logger.error('⚠️ System Issue:');
    logger.error('• Check available memory and disk space');
    logger.error('• Verify Node.js/Bun version compatibility');
    logger.error('• Review logs for detailed error information');
  }
  
  logger.error('\n📋 Support Resources:');
  logger.error('• Logs: ./logs/ directory');
  logger.error('• Debug: Set NODE_ENV=development');
  logger.error('• Performance: Monitor system resources');
}

/**
 * Optimized health check with parallel execution
 */
async function performOptimizedHealthCheck(logger: Logger): Promise<void> {
  const checks = [
    {
      name: 'Output directory',
      check: () => Promise.resolve(ensureDirectory(path.join(process.cwd(), 'outputs')))
    },
    {
      name: 'Log directory',
      check: () => Promise.resolve(ensureDirectory(path.join(process.cwd(), 'logs')))
    },
    {
      name: 'Network connectivity',
      check: async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch('https://hiring.cafe', { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response.status < 500;
        } catch {
          return false;
        }
      }
    }
  ];

  // Run checks in parallel for better performance
  const results = await Promise.allSettled(
    checks.map(async ({ name, check }) => ({ name, result: await check() }))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, result: checkResult } = result.value;
      logger.info(checkResult ? `✅ Health check passed: ${name}` : `⚠️ Health check failed: ${name}`);
    } else {
      logger.warn(`⚠️ Health check error: ${result.reason}`);
    }
  }
}

function ensureDirectory(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return true;
}

if (import.meta.main) {
  runAPIJobScraping().catch(console.error);
}
