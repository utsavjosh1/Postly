import asyncio
from playwright.async_api import async_playwright

async def _smoke_test_browser():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False, channel="chrome")
            page = await browser.new_page()
            await page.goto("https://example.com", wait_until="domcontentloaded")
            await browser.close()
            print("SMOKE TEST PASSED: Bare Chromium works fine")
    except Exception as e:
        print(f"SMOKE TEST FAILED: {e}")

if __name__ == '__main__':
    asyncio.run(_smoke_test_browser())
