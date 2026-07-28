import asyncio
from playwright.async_api import async_playwright

async def test_extract():
    p = await async_playwright().start()
    b = await p.chromium.connect_over_cdp("http://localhost:9222")
    page = b.contexts[0].pages[0]
    
    # Check all frames for the price text
    for frame in page.frames:
        try:
            val = await frame.evaluate("""
                () => {
                    // Look for valuesWrapper or valueValue elements in TradingView legend
                    const valWrap = document.querySelector('div[class*="valuesWrapper"], div[class*="valuesAdditionalWrapper"]');
                    if (valWrap) {
                        const txt = valWrap.innerText;
                        // Extract C (Close) or last number
                        // Format: O 2645.35 H 2654.75 L 2637.52 C 2647.64
                        const match = txt.match(/C\\s*([0-9,\\.]+)/) || txt.match(/([0-9]{3,4}\\.[0-9]+)/);
                        if (match) return { raw: txt, priceStr: match[1] };
                    }
                    // Fallback to any price element
                    const priceEl = document.querySelector('[class*="last-price"], [class*="current-price"], [class*="pane-legend-item-value"]');
                    if (priceEl) return { raw: priceEl.innerText, priceStr: priceEl.innerText };
                    return null;
                }
            """)
            if val:
                print(f"Extracted from frame {frame.url[:40]}:", val)
        except Exception as e:
            print("Frame eval error:", e)

    await b.close()
    await p.stop()

if __name__ == "__main__":
    asyncio.run(test_extract())
