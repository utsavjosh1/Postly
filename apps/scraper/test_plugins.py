import asyncio
from playwright.async_api import async_playwright

async def test_plugins(with_plugins_hack_enabled, tag):
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                ]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            )
            page = await context.new_page()
            
            if with_plugins_hack_enabled:
                await page.add_init_script("""
                    Object.defineProperty(navigator, 'plugins', { get: () => Object.freeze([{name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1}]) });
                """)

            print(f"[{tag}] going to hiring.cafe...")
            await page.goto("https://hiring.cafe", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(3000)
            title = await page.title()
            print(f"[{tag}] SUCCESS, title: {title}")
            await browser.close()
    except Exception as e:
        print(f"[{tag}] CRASH:", e)

async def main():
    print("Testing 1: WITH JS inject")
    await test_plugins(True, "with_js")
    
    print("Testing 2: WITHOUT JS inject")
    await test_plugins(False, "no_js")

if __name__ == '__main__':
    asyncio.run(main())
