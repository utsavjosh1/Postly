import { chromium, Browser, BrowserContext, Page } from "playwright";

// User agents for rotation
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  async initialize(): Promise<void> {
    if (this.browser && this.context) {
      return;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this._doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async _doInitialize(): Promise<void> {
    console.log("🌐 Initializing Playwright browser...");

    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
      permissions: [],
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
    });

    // Block unnecessary resources to speed up scraping
    await this.context.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      const blockedTypes = ["image", "stylesheet", "font", "media"];

      if (blockedTypes.includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    console.log("✅ Browser initialized successfully");
  }

  async getPage(): Promise<Page> {
    await this.initialize();

    if (!this.context) {
      throw new Error("Browser context not initialized");
    }

    const page = await this.context.newPage();

    // Add stealth scripts to avoid detection
    await page.addInitScript(() => {
      // Override webdriver property
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Override plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      // Override chrome property
      (globalThis as unknown as Record<string, unknown>).chrome = {
        runtime: {},
      };
    });

    return page;
  }

  async fetchPage(url: string, waitForSelector?: string): Promise<string> {
    const page = await this.getPage();

    try {
      console.log(`📄 Fetching: ${url}`);

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page
          .waitForSelector(waitForSelector, { timeout: 10000 })
          .catch(() => {
            console.warn(
              `⚠️ Selector "${waitForSelector}" not found, continuing anyway`,
            );
          });
      }

      // Small delay to let any dynamic content load
      await page.waitForTimeout(1000);

      const content = await page.content();
      return content;
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log("🔒 Browser closed");
  }

  // Rotate user agent for new context
  async rotateContext(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }

    if (!this.browser) {
      await this.initialize();
      return;
    }

    this.context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    console.log("🔄 Browser context rotated with new user agent");
  }
}

// Singleton instance
export const browserManager = new BrowserManager();

// Helper function for simple fetch with retry
export async function fetchWithBrowser(
  url: string,
  options: {
    waitForSelector?: string;
    retries?: number;
    retryDelay?: number;
  } = {},
): Promise<string> {
  const { waitForSelector, retries = 3, retryDelay = 2000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await browserManager.fetchPage(url, waitForSelector);
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `⚠️ Attempt ${attempt + 1}/${retries} failed for ${url}: ${lastError.message}`,
      );

      if (attempt < retries - 1) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Rotate context on retry to get fresh fingerprint
        if (attempt > 0) {
          await browserManager.rotateContext();
        }
      }
    }
  }

  throw (
    lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`)
  );
}

// Delay helper
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
