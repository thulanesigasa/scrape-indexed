import asyncio
from playwright.async_api import async_playwright

async def inspect():
    p = await async_playwright().start()
    try:
        b = await p.chromium.connect_over_cdp("http://localhost:9222")
        context = b.contexts[0]
        pages = context.pages
        print(f"Total pages open: {len(pages)}")
        for i, page in enumerate(pages):
            title = await page.title()
            print(f"Page {i}: {page.url} | Title: {title}")
            if "deriv" in page.url.lower() or "deriv" in title.lower():
                print("Found Deriv page! Inspecting frames...")
                for f_idx, frame in enumerate(page.frames):
                    print(f" Frame {f_idx}: {frame.url}")
                    try:
                        content = await frame.content()
                        # Extract elements with prices or classes
                        text = await frame.evaluate("""
                            () => {
                                const elements = Array.from(document.querySelectorAll('*'));
                                const priceElems = elements.filter(el => {
                                    const txt = el.innerText || '';
                                    return txt.includes('2,6') || txt.includes('264') || txt.includes('C2,') || txt.includes('Volatility');
                                }).map(el => ({
                                    tag: el.tagName,
                                    class: el.className,
                                    text: el.innerText ? el.innerText.substring(0, 100) : ''
                                }));
                                return priceElems.slice(0, 20);
                            }
                        """)
                        print(f"  Frame {f_idx} matching elements:", text)
                    except Exception as e:
                        print(f"  Frame {f_idx} error: {e}")
    except Exception as e:
        print("Inspection error:", e)
    finally:
        await p.stop()

if __name__ == "__main__":
    asyncio.run(inspect())
