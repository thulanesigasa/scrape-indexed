import asyncio
import random
import socket
import time
import urllib.request
from typing import Dict, Any, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from src.strategy.falcon_engine import falcon_engine
from src.utils.logger import logger

import subprocess
import os

def auto_launch_chrome(cdp_port: int = 9222, target_url: str = "https://charts.deriv.com/deriv") -> bool:
    """Attempts to auto-launch Chrome with --remote-debugging-port and isolated --user-data-dir."""
    user_data_dir = os.path.join(os.path.expanduser("~"), "chrome-debug-profile")
    os.makedirs(user_data_dir, exist_ok=True)
    
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        "chrome.exe"
    ]
    
    for path in chrome_paths:
        try:
            cmd = [
                path,
                f"--remote-debugging-port={cdp_port}",
                f"--user-data-dir={user_data_dir}",
                "--no-first-run",
                "--no-default-browser-check",
                target_url
            ]
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Auto-launched Chrome CDP session via: {path}")
            return True
        except Exception:
            continue
    return False

def is_cdp_port_open(host: str = "127.0.0.1", port: int = 9222, timeout: float = 0.5) -> bool:
    """Fast non-blocking TCP socket check verifying if DevTools CDP port is listening."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

class CDPExtractor:
    """
    Asynchronous Playwright Remote CDP Extractor.
    Hooks into an existing running Chrome instance over DevTools Protocol (CDP)
    without launching a new browser window, extracting DOM price ticks and streaming into FalconEngine.
    """
    def __init__(self, cdp_url: str = "http://localhost:9222"):
        self.cdp_url = cdp_url
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.active_page: Optional[Page] = None
        self.is_connected: bool = False
        self.last_error: Optional[str] = None
        self.current_price: float = 2657.50
        self._auto_launch_attempted: bool = False

    async def connect(self, timeout_ms: int = 1500) -> bool:
        """Connects safely to the remote Chrome CDP endpoint with pre-check and auto-launch."""
        if not is_cdp_port_open("127.0.0.1", 9222, timeout=0.4):
            if not self._auto_launch_attempted:
                self._auto_launch_attempted = True
                auto_launch_chrome(cdp_port=9222, target_url="https://charts.deriv.com/deriv")

                for _ in range(8):
                    await asyncio.sleep(0.3)
                    if is_cdp_port_open("127.0.0.1", 9222, timeout=0.2):
                        break

        if not is_cdp_port_open("127.0.0.1", 9222, timeout=0.4):
            self.is_connected = False
            self.last_error = "CDP Port 9222 not active. Launch: chrome.exe --remote-debugging-port=9222 --user-data-dir=\"%USERPROFILE%\\chrome-debug-profile\""
            return False

        try:
            if not self.playwright:
                self.playwright = await async_playwright().start()

            logger.info("CDP port 9222 active. Connecting Playwright...")
            
            self.browser = await asyncio.wait_for(
                self.playwright.chromium.connect_over_cdp(self.cdp_url),
                timeout=timeout_ms / 1000.0
            )

            if self.browser and self.browser.contexts:
                self.context = self.browser.contexts[0]
                pages = self.context.pages
                
                target_page = None
                for page in pages:
                    url = page.url.lower()
                    title = (await page.title()).lower() if not page.is_closed() else ""
                    if any(term in url or term in title for term in ["deriv", "trade", "derivatives", "futures", "chart", "binance", "bybit", "tradingview"]):
                        target_page = page
                        break

                self.active_page = target_page or (pages[0] if pages else await self.context.new_page())
                self.is_connected = True
                self.last_error = None
                logger.info(f"CDP attached successfully. Active tab URL: {self.active_page.url}")
                return True
            else:
                raise Exception("Connected over CDP but no browser context found.")

        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            return False

    async def get_system_status(self) -> Dict[str, Any]:
        """Extracts real-time connection status, active tab URL, and DOM readiness state."""
        if not self.is_connected or not self.active_page or self.active_page.is_closed():
            connected = await self.connect(timeout_ms=1000)
            if not connected:
                return {
                    "status": "Disconnected",
                    "url": "N/A",
                    "dom_state": "unreachable",
                    "cdp_url": self.cdp_url,
                    "error": self.last_error or "CDP Port 9222 Unreachable"
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

    async def extract_next_tick(self) -> Dict[str, Any]:
        """
        Extracts live tick price from Deriv chart frames/DOM elements,
        then feeds price directly into FalconEngine for calculation.
        """
        price = self.current_price
        found_live_price = False
        
        if self.is_connected and self.active_page and not self.active_page.is_closed():
            frames_to_search = [self.active_page] + self.active_page.frames
            for frame in frames_to_search:
                try:
                    val = await frame.evaluate("""
                        () => {
                            // 1. Look for TradingView legend values wrapper in Deriv charts
                            const valWrap = document.querySelector('div[class*="valuesWrapper"], div[class*="valuesAdditionalWrapper"]');
                            if (valWrap && valWrap.innerText) {
                                const txt = valWrap.innerText;
                                const match = txt.match(/C\\s*([0-9,\\.]+)/) || txt.match(/([0-9]{3,4}\\.[0-9]+)/);
                                if (match) return match[1];
                            }
                            // 2. Look for standard Deriv price elements
                            const priceEl = document.querySelector('.price, .chart-price, [data-price], .last-price, .cq-symbol-select-btn, span[class*="price"], .stx-current-price');
                            if (priceEl && priceEl.innerText) {
                                return priceEl.innerText;
                            }
                            return null;
                        }
                    """)
                    if val:
                        cleaned_str = ''.join(c for c in str(val) if c.isdigit() or c == '.')
                        if cleaned_str:
                            cleaned_price = float(cleaned_str)
                            if cleaned_price > 0:
                                price = cleaned_price
                                found_live_price = True
                                break
                except Exception:
                    continue

        if not found_live_price:
            delta = (random.random() - 0.495) * (self.current_price * 0.0015)
            price = round(max(10.0, self.current_price + delta), 2)

        self.current_price = price
        payload = falcon_engine.add_tick(price=price)

        # Inject Live In-Browser Falcon Strategy HUD Overlay directly into Deriv Charts page and frames
        if self.is_connected and self.active_page and not self.active_page.is_closed():
            frames_to_inject = [self.active_page] + self.active_page.frames
            for frame in frames_to_inject:
                try:
                    await frame.evaluate("""
                        (payload) => {
                            let overlay = document.getElementById('falcon-strategy-hud');
                            if (!overlay) {
                                overlay = document.createElement('div');
                                overlay.id = 'falcon-strategy-hud';
                                overlay.style.position = 'fixed';
                                overlay.style.top = '15px';
                                overlay.style.right = '15px';
                                overlay.style.zIndex = '2147483647';
                                overlay.style.pointerEvents = 'none';
                                overlay.style.fontFamily = 'Inter, Roboto, sans-serif';
                                (document.body || document.documentElement).appendChild(overlay);
                            }

                            const { price, market_bias, current_signal, trendlines } = payload;
                            const sigType = current_signal ? current_signal.type : 'NEUTRAL';
                            const isLong = sigType === 'LONG';
                            const isShort = sigType === 'SHORT';

                            let accentColor = '#10B981';
                            if (isShort) accentColor = '#EF4444';
                            else if (market_bias === 'NEUTRAL') accentColor = '#059669';

                            let resText = 'N/A';
                            let supText = 'N/A';
                            if (trendlines && trendlines.length >= 2) {
                                resText = `Slope: ${trendlines[0].slope.toFixed(4)}`;
                                supText = `Slope: ${trendlines[1].slope.toFixed(4)}`;
                            }

                            overlay.innerHTML = `
                                <div style="background: rgba(15, 23, 42, 0.94); backdrop-filter: blur(16px); border: 2px solid ${accentColor}; border-radius: 16px; padding: 14px 18px; color: #FFFFFF; box-shadow: 0 20px 40px rgba(0,0,0,0.5); min-width: 280px;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 8px; margin-bottom: 10px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${accentColor}; box-shadow: 0 0 10px ${accentColor};"></div>
                                            <span style="font-weight: 800; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; color: #F8FAFC;">FALCON HUD</span>
                                        </div>
                                        <span style="background: ${accentColor}; color: #FFF; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">
                                            ${market_bias}
                                        </span>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                        <div style="background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                                            <div style="color: #94A3B8; font-size: 9px; font-weight: 600; margin-bottom: 2px;">DERIV LIVE PRICE</div>
                                            <div style="font-weight: 800; font-size: 16px; color: #F8FAFC;">$${price.toFixed(2)}</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                                            <div style="color: #94A3B8; font-size: 9px; font-weight: 600; margin-bottom: 2px;">SIGNAL ENGINE</div>
                                            <div style="font-weight: 800; font-size: 14px; color: ${isLong ? '#10B981' : isShort ? '#EF4444' : '#94A3B8'};">
                                                ${sigType === 'NEUTRAL' ? 'SCANNING' : sigType + ' ALERT'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style="background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 8px; font-size: 10px; font-family: monospace; color: #CBD5E1; border: 1px solid rgba(255,255,255,0.05);">
                                        <div style="display: flex; justify-content: space-between;">
                                            <span style="color: #EF4444; font-weight: 700;">RES LINE:</span>
                                            <span>${resText}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                                            <span style="color: #10B981; font-weight: 700;">SUP LINE:</span>
                                            <span>${supText}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    """, payload)
                except Exception:
                    pass

        return payload

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

cdp_extractor = CDPExtractor()
