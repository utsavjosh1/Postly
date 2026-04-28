import asyncio
from playwright.async_api import async_playwright

async def test_single_process():
    try:
        async with async_playwright() as pw:
            print("launching single process chromium...")
            browser = await pw.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--single-process",  # Stops subprocess spawning (avoids mach_port failures)
                ]
            )
            print("context...")
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
            )
            print("page...")
            page = await context.new_page()
            
            await page.add_init_script("""
                Object.defineProperty(navigator, 'plugins', { get: () => Object.freeze([{name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1}]) });
                window.chrome = { runtime: {} };
            """)

            print("going to hiring.cafe...")
            await page.goto("https://hiring.cafe", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(3000)
            html = await page.evaluate("() => document.title")
            print(f"SUCCESS, title: {html}")
            await browser.close()
    except Exception as e:
        print("CRASH:", e)

if __name__ == '__main__':
    asyncio.run(test_single_process())
