import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from src.utils.logger import logger

class FalconStrategyEngine:
    """
    Falcon Algorithmic Strategy Engine.
    Performs automated trendline mapping, swing high/low pivot calculations,
    and long/short signal generation based on price action breakouts & bounce patterns.
    """
    def __init__(self, swing_window: int = 3, max_history: int = 100):
        self.swing_window = swing_window
        self.max_history = max_history
        self.ticks_history: List[Dict[str, Any]] = []

    def push_tick(self, tick: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any]]:
        """
        Appends tick data, calculates OHLC candles if needed, extracts swing points,
        calculates support/resistance trendlines, and generates current trading signal.
        """
        self.ticks_history.append(tick)
        if len(self.ticks_history) > self.max_history:
            self.ticks_history.pop(0)

        prices = [t["price"] for t in self.ticks_history]
        swings = self.calculate_swings(prices)
        trendlines = self.compute_trendlines(prices, swings)
        signal = self.evaluate_signal(prices[-1], trendlines, swings)

        return swings, trendlines, signal

    def calculate_swings(self, prices: List[float]) -> List[Dict[str, Any]]:
        """Identifies local swing highs and swing lows across price window."""
        swings = []
        if len(prices) < (2 * self.swing_window + 1):
            return swings

        for i in range(self.swing_window, len(prices) - self.swing_window):
            window = prices[i - self.swing_window : i + self.swing_window + 1]
            current = prices[i]
            
            if current == max(window):
                swings.append({"index": i, "price": current, "type": "SWING_HIGH"})
            elif current == min(window):
                swings.append({"index": i, "price": current, "type": "SWING_LOW"})

        return swings

    def compute_trendlines(self, prices: List[float], swings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates linear regression support and resistance trendlines from swing nodes."""
        n = len(prices)
        if n < 5:
            current = prices[-1] if prices else 65000.0
            return {
                "resistance": {"slope": 0.0, "intercept": current * 1.005, "current_val": current * 1.005},
                "support": {"slope": 0.0, "intercept": current * 0.995, "current_val": current * 0.995}
            }

        swing_highs = [s for s in swings if s["type"] == "SWING_HIGH"]
        swing_lows = [s for s in swings if s["type"] == "SWING_LOW"]

        # Calculate upper resistance line
        if len(swing_highs) >= 2:
            x = np.array([s["index"] for s in swing_highs[-4:]])
            y = np.array([s["price"] for s in swing_highs[-4:]])
            m_res, c_res = np.polyfit(x, y, 1)
        else:
            m_res = 0.05
            c_res = max(prices)

        # Calculate lower support line
        if len(swing_lows) >= 2:
            x = np.array([s["index"] for s in swing_lows[-4:]])
            y = np.array([s["price"] for s in swing_lows[-4:]])
            m_sup, c_sup = np.polyfit(x, y, 1)
        else:
            m_sup = 0.05
            c_sup = min(prices)

        current_res = round(float(m_res * (n - 1) + c_res), 2)
        current_sup = round(float(m_sup * (n - 1) + c_sup), 2)

        return {
            "resistance": {"slope": round(float(m_res), 4), "intercept": round(float(c_res), 2), "current_val": current_res},
            "support": {"slope": round(float(m_sup), 4), "intercept": round(float(c_sup), 2), "current_val": current_sup}
        }

    def evaluate_signal(self, current_price: float, trendlines: Dict[str, Any], swings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generates Falcon Strategy LONG, SHORT, or HOLD signal with Risk Management SL/TP."""
        res_val = trendlines["resistance"]["current_val"]
        sup_val = trendlines["support"]["current_val"]

        signal_type = "HOLD"
        confidence = 70.0
        stop_loss = current_price
        take_profit = current_price

        # Falcon Bullish Breakout above resistance
        if current_price >= res_val:
            signal_type = "LONG_ENTRY"
            confidence = min(98.0, 85.0 + ((current_price - res_val) / res_val * 1000))
            stop_loss = round(sup_val, 2)
            take_profit = round(current_price + (current_price - sup_val) * 1.8, 2)

        # Falcon Bearish Breakdown below support
        elif current_price <= sup_val:
            signal_type = "SHORT_ENTRY"
            confidence = min(98.0, 85.0 + ((sup_val - current_price) / sup_val * 1000))
            stop_loss = round(res_val, 2)
            take_profit = round(current_price - (res_val - current_price) * 1.8, 2)

        return {
            "signal": signal_type,
            "confidence": round(confidence, 1),
            "current_price": current_price,
            "resistance_level": res_val,
            "support_level": sup_val,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "risk_reward_ratio": 1.8 if signal_type != "HOLD" else 0.0
        }
