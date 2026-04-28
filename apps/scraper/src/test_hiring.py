import asyncio
import logging
from spiders.hiring_cafe import HiringCafeSpider
from playwright.async_api import async_playwright

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

async def test_clearance():
    spider = HiringCafeSpider()
    async with async_playwright() as pw:
        try:
            cookies, ua = await spider._get_clearance(pw)
            has_clearance = any(c['name'] == 'cf_clearance' for c in cookies)
            print(f">>> TEST RESULT: cf_clearance obtained: {has_clearance}")
        except Exception as e:
            print(f">>> TEST ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_clearance())
