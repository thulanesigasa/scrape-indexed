import time
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from src.utils.logger import logger, signal_logger

class SignalEvent:
    """Analytical SignalEvent representing a trendline breakout occurrence."""
    def __init__(self, type: str, entry: float, stop_loss: float, target: float, timestamp: float, broken_trendline: Optional[Dict[str, Any]] = None):
        self.type = type # LONG, SHORT, or NEUTRAL
        self.entry = entry
        self.stop_loss = stop_loss
        self.target = target
        self.timestamp = timestamp
        self.broken_trendline = broken_trendline or {}
        self.max_favorable_excursion: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "entry": self.entry,
            "stop_loss": self.stop_loss,
            "target": self.target,
            "timestamp": self.timestamp,
            "broken_trendline": self.broken_trendline,
            "max_favorable_excursion": self.max_favorable_excursion
        }

class FalconEngine:
    """
    Falcon Analytical Strategy Engine.
    Strictly performs price action trendline analysis, swing detection, and signal event tracking.
    No automated trade execution logic is present; output is intended purely for trader alerts and visual analytics.
    """
    def __init__(self, swing_window: int = 3, max_candles: int = 60, max_history_signals: int = 20):
        self.swing_window = swing_window
        self.max_candles = max_candles
        self.max_history_signals = max_history_signals
        self.candles: List[Dict[str, Any]] = []
        self.historical_signals: List[Dict[str, Any]] = []
        self.last_emitted_signal: Optional[str] = "NEUTRAL"
        self.market_bias: str = "NEUTRAL"

    def add_tick(self, price: float, timestamp: Optional[float] = None) -> Dict[str, Any]:
        """
        Ingests a price tick, updates OHLC candle windows, evaluates trendline breakouts,
        updates historical signal performance tracking, and returns analytical payload.
        """
        ts = timestamp or time.time()
        
        # Maintain 1-second candle aggregation
        if not self.candles or (ts - self.candles[-1]["timestamp"]) >= 1.0:
            new_candle = {
                "index": len(self.candles),
                "timestamp": ts,
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": round(float(np.random.uniform(0.5, 5.0)), 2)
            }
            self.candles.append(new_candle)
            if len(self.candles) > self.max_candles:
                self.candles.pop(0)
                for idx, c in enumerate(self.candles):
                    c["index"] = idx
        else:
            current_candle = self.candles[-1]
            current_candle["high"] = max(current_candle["high"], price)
            current_candle["low"] = min(current_candle["low"], price)
            current_candle["close"] = price

        swings = self.detect_swing_points()
        trendlines = self.calculate_trendlines(swings)
        signal_event = self.evaluate_signal(price, trendlines, ts)

        # Update Maximum Favorable Excursion for active historical signals
        self.update_historical_excursion(price)

        return {
            "timestamp": ts,
            "price": price,
            "market_bias": self.market_bias,
            "candles": self.candles,
            "trendlines": trendlines,
            "current_signal": signal_event.to_dict(),
            "historical_signals": self.historical_signals
        }

    def detect_swing_points(self) -> Dict[str, List[Dict[str, Any]]]:
        """Detects local maxima (swing highs) and local minima (swing lows)."""
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
        """Calculates support and resistance linear regression trendlines with coordinates (x1, y1, x2, y2)."""
        n = len(self.candles)
        if n < 5:
            last_price = self.candles[-1]["close"] if self.candles else 65240.0
            return [
                {"type": "resistance", "x1": 0, "y1": round(last_price * 1.005, 2), "x2": max(1, n - 1), "y2": round(last_price * 1.005, 2)},
                {"type": "support", "x1": 0, "y1": round(last_price * 0.995, 2), "x2": max(1, n - 1), "y2": round(last_price * 0.995, 2)}
            ]

        highs = swings["highs"]
        lows = swings["lows"]

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

    def evaluate_signal(self, current_price: float, trendlines: List[Dict[str, Any]], timestamp: float) -> SignalEvent:
        """
        Evaluates trendline breakouts and constructs SignalEvent objects.
        Logs new breakout events to SQLite and maintains market bias analytics.
        """
        res_line = next((t for t in trendlines if t["type"] == "resistance"), None)
        sup_line = next((t for t in trendlines if t["type"] == "support"), None)

        res_val = res_line["y2"] if res_line else current_price * 1.005
        sup_val = sup_line["y2"] if sup_line else current_price * 0.995

        sig_type = "NEUTRAL"
        broken_tl = None

        if current_price >= res_val:
            sig_type = "LONG"
            broken_tl = res_line
            self.market_bias = "BULLISH"
        elif current_price <= sup_val:
            sig_type = "SHORT"
            broken_tl = sup_line
            self.market_bias = "BEARISH"

        stop_loss = round(sup_val if sig_type == "LONG" else res_val if sig_type == "SHORT" else current_price, 2)
        target = round(current_price + (current_price - stop_loss) * 1.8 if sig_type == "LONG" else current_price - (stop_loss - current_price) * 1.8 if sig_type == "SHORT" else current_price, 2)

        signal_event = SignalEvent(
            type=sig_type,
            entry=current_price,
            stop_loss=stop_loss,
            target=target,
            timestamp=timestamp,
            broken_trendline=broken_tl
        )

        # Log new breakout event when state transitions from NEUTRAL or opposite direction
        if sig_type != "NEUTRAL" and sig_type != self.last_emitted_signal:
            self.last_emitted_signal = sig_type
            event_dict = signal_event.to_dict()
            self.historical_signals.insert(0, event_dict)
            if len(self.historical_signals) > self.max_history_signals:
                self.historical_signals.pop()

            # Record event to SQLite database & JSON logger
            signal_logger.log_signal(event_dict)

        return signal_event

    def update_historical_excursion(self, current_price: float):
        """Updates maximum favorable excursion (MFE) on logged historical signals for accuracy analysis."""
        for sig in self.historical_signals:
            sig_type = sig["type"]
            entry = sig["entry"]
            if sig_type == "LONG":
                gain = current_price - entry
                sig["max_favorable_excursion"] = max(sig.get("max_favorable_excursion", 0.0), round(gain, 2))
            elif sig_type == "SHORT":
                gain = entry - current_price
                sig["max_favorable_excursion"] = max(sig.get("max_favorable_excursion", 0.0), round(gain, 2))

falcon_engine = FalconEngine()
