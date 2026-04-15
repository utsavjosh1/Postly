import asyncio
from playwright.async_api import async_playwright

async def test_args(args_list, tag):
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=args_list
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = await context.new_page()
            await page.add_init_script("""
                Object.defineProperty(navigator, 'plugins', { get: () => Object.freeze([{name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1}]) });
                window.chrome = { runtime: {} };
            """)
            print(f"[{tag}] going to hiring.cafe...")
            await page.goto("https://hiring.cafe", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(3000)
            print(f"[{tag}] SUCCESS")
            await browser.close()
    except Exception as e:
        print(f"[{tag}] CRASH:", e)

async def main():
    print("Testing config 1: default + swiftshader")
    await test_args([
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--use-gl=swiftshader"
    ], "swiftshader")
    
    print("Testing config 2: default WITHOUT swiftshader (no disable-gpu)")
    await test_args([
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage"
    ], "no-gpu-flags")

    print("Testing config 3: angle swiftshader")
    await test_args([
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader"
    ], "angle-swiftshader")

if __name__ == '__main__':
    asyncio.run(main())
