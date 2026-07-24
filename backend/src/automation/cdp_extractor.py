import asyncio
from typing import Dict, Any, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from src.utils.logger import logger

class CDPExtractor:
    """
    Asynchronous Playwright Remote CDP Extractor.
    Hooks into an existing running Chrome instance over DevTools Protocol (CDP)
    without launching a new browser window, specifically targeting derivatives trading tabs.
    """
    def __init__(self, cdp_url: str = "http://localhost:9222"):
        self.cdp_url = cdp_url
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.active_page: Optional[Page] = None
        self.is_connected: bool = False
        self.last_error: Optional[str] = None

    async def connect(self, timeout_ms: int = 5000) -> bool:
        """
        Connects safely to the remote Chrome CDP endpoint.
        Scans existing pages for a trading/derivatives tab or defaults to the active page.
        """
        try:
            if not self.playwright:
                self.playwright = await async_playwright().start()

            logger.info(f"Attempting CDP connection to {self.cdp_url} (timeout: {timeout_ms}ms)...")
            
            # Connect over CDP using asyncio timeout handling
            self.browser = await asyncio.wait_for(
                self.playwright.chromium.connect_over_cdp(self.cdp_url),
                timeout=timeout_ms / 1000.0
            )

            if self.browser and self.browser.contexts:
                self.context = self.browser.contexts[0]
                pages = self.context.pages
                
                # Search for derivatives/trading tab or pick first active tab
                target_page = None
                for page in pages:
                    url = page.url.lower()
                    title = (await page.title()).lower() if not page.is_closed() else ""
                    if any(term in url or term in title for term in ["trade", "derivatives", "futures", "chart", "binance", "bybit", "tradingview"]):
                        target_page = page
                        break

                self.active_page = target_page or (pages[0] if pages else await self.context.new_page())
                self.is_connected = True
                self.last_error = None
                logger.info(f"CDP attached successfully. Active tab URL: {self.active_page.url}")
                return True
            else:
                raise Exception("Connected over CDP but no browser context found.")

        except asyncio.TimeoutError:
            self.is_connected = False
            self.last_error = f"Connection timeout after {timeout_ms}ms connecting to {self.cdp_url}"
            logger.info(f"CDP connection timeout: {self.last_error}")
            return False
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            logger.info(f"CDP connection standby/offline: {self.last_error}")
            return False

    async def get_system_status(self) -> Dict[str, Any]:
        """
        Extracts real-time connection status, active tab URL, and DOM readiness state.
        """
        if not self.is_connected or not self.active_page or self.active_page.is_closed():
            connected = await self.connect(timeout_ms=1500)
            if not connected:
                return {
                    "status": "Disconnected",
                    "url": "N/A",
                    "dom_state": "unreachable",
                    "cdp_url": self.cdp_url,
                    "error": self.last_error or "CDP Browser Offline"
                }

        try:
            url = self.active_page.url
            dom_state = await self.active_page.evaluate("document.readyState")
            title = await self.active_page.title()

            return {
                "status": "Connected",
                "url": url,
                "title": title,
                "dom_state": dom_state,
                "cdp_url": self.cdp_url,
                "error": None
            }
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            return {
                "status": "Disconnected",
                "url": "N/A",
                "dom_state": "error",
                "cdp_url": self.cdp_url,
                "error": str(e)
            }

    async def close(self):
        """Cleanly closes browser connection context."""
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception as e:
            logger.error(f"Error closing CDP extractor: {e}")
        finally:
            self.is_connected = False

# Global extractor instance
cdp_extractor = CDPDOMExtractor_instance = CDPExtractor()
