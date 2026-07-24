import time
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from src.utils.logger import logger

class FalconEngine:
    """
    Falcon Strategy Mathematical Engine.
    Processes time-series price ticks/OHLC candles, detects swing high/low pivots,
    fits resistance & support linear regression trendlines with (x1, y1, x2, y2) coordinates,
    and evaluates LONG, SHORT, or NEUTRAL breakout signals with Stop Loss & Take Profit targets.
    """
    def __init__(self, swing_window: int = 3, max_candles: int = 60):
        self.swing_window = swing_window
        self.max_candles = max_candles
        self.candles: List[Dict[str, Any]] = []

    def add_tick(self, price: float, timestamp: Optional[float] = None) -> Dict[str, Any]:
        """
        Ingests a price tick, updates OHLC candle windows, computes trendlines,
        and evaluates trading breakout signals.
        """
        ts = timestamp or time.time()
        
        # Build or update current 1-second OHLC candle window
        if not self.candles or (ts - self.candles[-1]["timestamp"]) >= 1.0:
            new_candle = {
                "index": len(self.candles),
                "timestamp": ts,
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": round(np.random.uniform(0.5, 5.0), 2)
            }
            self.candles.append(new_candle)
            if len(self.candles) > self.max_candles:
                self.candles.pop(0)
                # Re-index remaining candles for continuous coordinate math
                for idx, c in enumerate(self.candles):
                    c["index"] = idx
        else:
            current_candle = self.candles[-1]
            current_candle["high"] = max(current_candle["high"], price)
            current_candle["low"] = min(current_candle["low"], price)
            current_candle["close"] = price

        swings = self.detect_swing_points()
        trendlines = self.calculate_trendlines(swings)
        signal = self.evaluate_signal(price, trendlines)

        return {
            "timestamp": ts,
            "price": price,
            "candles": self.candles,
            "trendlines": trendlines,
            "signal": signal
        }

    def detect_swing_points(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Detects local maxima (swing highs) and local minima (swing lows)
        across the configurable sliding lookback window N.
        """
        highs = []
        lows = []
        n_candles = len(self.candles)

        if n_candles < (2 * self.swing_window + 1):
            return {"highs": highs, "lows": lows}

        closes = [c["close"] for c in self.candles]

        for i in range(self.swing_window, n_candles - self.swing_window):
            window = closes[i - self.swing_window : i + self.swing_window + 1]
            current = closes[i]

            if current == max(window):
                highs.append({"index": i, "price": current, "type": "SWING_HIGH"})
            elif current == min(window):
                lows.append({"index": i, "price": current, "type": "SWING_LOW"})

        return {"highs": highs, "lows": lows}

    def calculate_trendlines(self, swings: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Calculates linear regression support and resistance trendlines, returning
        structured coordinates: {"type": "resistance", "x1": ..., "y1": ..., "x2": ..., "y2": ...}
        """
        n = len(self.candles)
        if n < 5:
            last_price = self.candles[-1]["close"] if self.candles else 65000.0
            return [
                {"type": "resistance", "x1": 0, "y1": round(last_price * 1.005, 2), "x2": max(1, n - 1), "y2": round(last_price * 1.005, 2)},
                {"type": "support", "x1": 0, "y1": round(last_price * 0.995, 2), "x2": max(1, n - 1), "y2": round(last_price * 0.995, 2)}
            ]

        highs = swings["highs"]
        lows = swings["lows"]

        # Calculate Resistance Trendline (fitting upper swing highs)
        if len(highs) >= 2:
            x_res = np.array([h["index"] for h in highs[-4:]])
            y_res = np.array([h["price"] for h in highs[-4:]])
            m_res, c_res = np.polyfit(x_res, y_res, 1)
            x1_res = int(x_res[0])
            y1_res = round(float(m_res * x1_res + c_res), 2)
            x2_res = n - 1
            y2_res = round(float(m_res * x2_res + c_res), 2)
        else:
            x1_res = 0
            y1_res = round(max([c["high"] for c in self.candles]), 2)
            x2_res = n - 1
            y2_res = y1_res

        # Calculate Support Trendline (fitting lower swing lows)
        if len(lows) >= 2:
            x_sup = np.array([l["index"] for l in lows[-4:]])
            y_sup = np.array([l["price"] for l in lows[-4:]])
            m_sup, c_sup = np.polyfit(x_sup, y_sup, 1)
            x1_sup = int(x_sup[0])
            y1_sup = round(float(m_sup * x1_sup + c_sup), 2)
            x2_sup = n - 1
            y2_sup = round(float(m_sup * x2_sup + c_sup), 2)
        else:
            x1_sup = 0
            y1_sup = round(min([c["low"] for c in self.candles]), 2)
            x2_sup = n - 1
            y2_sup = y1_sup

        return [
            {"type": "resistance", "x1": x1_res, "y1": y1_res, "x2": x2_res, "y2": y2_res},
            {"type": "support", "x1": x1_sup, "y1": y1_sup, "x2": x2_sup, "y2": y2_sup}
        ]

    def evaluate_signal(self, current_price: float, trendlines: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates breakout signal triggers based on price position relative to trendlines:
        - LONG signal when price breaks above resistance line.
        - SHORT signal when price breaks below support line.
        - NEUTRAL otherwise.
        """
        res_line = next((t for t in trendlines if t["type"] == "resistance"), None)
        sup_line = next((t for t in trendlines if t["type"] == "support"), None)

        res_val = res_line["y2"] if res_line else current_price * 1.005
        sup_val = sup_line["y2"] if sup_line else current_price * 0.995

        signal_type = "NEUTRAL"
        entry = current_price
        stop_loss = current_price
        target = current_price

        # LONG Signal Trigger: Bullish breakout above resistance
        if current_price >= res_val:
            signal_type = "LONG"
            entry = current_price
            stop_loss = round(sup_val, 2)
            target = round(entry + (entry - stop_loss) * 1.8, 2)

        # SHORT Signal Trigger: Bearish breakdown below support
        elif current_price <= sup_val:
            signal_type = "SHORT"
            entry = current_price
            stop_loss = round(res_val, 2)
            target = round(entry - (stop_loss - entry) * 1.8, 2)

        return {
            "type": signal_type,
            "entry": entry,
            "stop_loss": stop_loss,
            "target": target
        }

falcon_engine = FalconEngine()
