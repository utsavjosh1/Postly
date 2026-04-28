import asyncio
import os
from playwright.async_api import async_playwright

async def test_no_sandbox(with_js_inject, tag):
    try:
        async with async_playwright() as pw:
            # specifically ensuring --no-sandbox is absent!
            browser = await pw.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()
            
            if with_js_inject:
                await page.add_init_script("""
                    Object.defineProperty(navigator, 'plugins', { get: () => Object.freeze([{name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1}]) });
                    window.chrome = { runtime: {} };
                """)

            print(f"[{tag}] going to hiring.cafe...")
            await page.goto("https://hiring.cafe", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(3000)
            html = await page.evaluate("() => document.title")
            print(f"[{tag}] SUCCESS, title: {html}")
            await browser.close()
    except Exception as e:
        print(f"[{tag}] CRASH:", e)

async def main():
    print("Testing 1: NO NO-SANDBOX, WITH JS")
    await test_no_sandbox(True, "with_js")
    
    print("Testing 2: NO NO-SANDBOX, NO JS")
    await test_no_sandbox(False, "no_js")

if __name__ == '__main__':
    asyncio.run(main())
