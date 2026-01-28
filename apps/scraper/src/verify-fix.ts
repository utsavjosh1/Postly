import { WeWorkRemotelyScraper } from "./scrapers/weworkremotely.scraper.js";
import { RemoteCoScraper } from "./scrapers/remote-co.scraper.js";
import { browserManager } from "./utils/browser.js";

async function verify() {
  console.log("🚀 Starting verification...");

  // Verify WWR
  try {
    console.log("\n🧪 Testing WeWorkRemotely Scraper...");
    const wwr = new WeWorkRemotelyScraper();
    // Monkey patch fetchWithBrowser to save file
    const originalFetch = wwr["fetchWithBrowser"].bind(wwr);
    wwr["fetchWithBrowser"] = async (url, selector, options) => {
      const html = await originalFetch(url, selector, options);
      const fs = await import("fs");
      fs.writeFileSync("debug-wwr-browser.html", html);
      console.log("💾 Saved WWR HTML to debug-wwr-browser.html");
      return html;
    };

    const jobs = await wwr.scrape();
    console.log(`✅ WWR Success! Found ${jobs.length} jobs.`);
    if (jobs.length > 0) {
      console.log("Sample job:", jobs[0]);
    } else {
      console.error("❌ WWR found 0 jobs. Check debug-wwr-browser.html");
    }
  } catch (error) {
    console.error("❌ WWR Failed:", error);
  }

  // Verify Remote.co
  try {
    console.log("\n🧪 Testing Remote.co Scraper...");
    const remoteCo = new RemoteCoScraper();

    const jobs = await remoteCo.scrape();
    console.log(`✅ Remote.co Success! Found ${jobs.length} jobs.`);
    if (jobs.length > 0) {
      console.log("Sample job:", jobs[0]);
    }
  } catch (error) {
    console.error("❌ Remote.co Failed:", error);
  }

  await browserManager.close();
  console.log("\n🏁 Verification complete.");
}

verify();
