import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from src.utils.logger import logger

class FalconStrategyEngine:
    """
    Falcon Algorithmic Strategy Engine.
    Performs automated trendline mapping, swing high/low pivot calculations,
    EMA trend direction confirmation, and long/short signal generation with dynamic SL/TP.
    """
    def __init__(self, swing_window: int = 3, max_history: int = 120, ema_fast_period: int = 9, ema_slow_period: int = 21):
        self.swing_window = swing_window
        self.max_history = max_history
        self.ema_fast_period = ema_fast_period
        self.ema_slow_period = ema_slow_period
        self.ticks_history: List[Dict[str, Any]] = []

    def push_tick(self, tick: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any]]:
        """
        Appends tick data, calculates OHLC candles, extracts swing points,
        calculates support/resistance trendlines, computes EMA confirmation, and generates current trading signal.
        """
        self.ticks_history.append(tick)
        if len(self.ticks_history) > self.max_history:
            self.ticks_history.pop(0)

        prices = [t["price"] for t in self.ticks_history]
        swings = self.calculate_swings(prices)
        trendlines = self.compute_trendlines(prices, swings)
        ema_fast, ema_slow = self.compute_ema(prices)
        signal = self.evaluate_signal(prices[-1], trendlines, swings, ema_fast, ema_slow)

        return swings, trendlines, signal

    def compute_ema(self, prices: List[float]) -> Tuple[float, float]:
        """Calculates Fast and Slow Exponential Moving Averages for trend confirmation."""
        if len(prices) < self.ema_slow_period:
            current = prices[-1] if prices else 65000.0
            return current, current

        series = pd.Series(prices)
        ema_fast = series.ewm(span=self.ema_fast_period, adjust=False).mean().iloc[-1]
        ema_slow = series.ewm(span=self.ema_slow_period, adjust=False).mean().iloc[-1]
        return round(float(ema_fast), 2), round(float(ema_slow), 2)

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

        if len(swing_highs) >= 2:
            x = np.array([s["index"] for s in swing_highs[-4:]])
            y = np.array([s["price"] for s in swing_highs[-4:]])
            m_res, c_res = np.polyfit(x, y, 1)
        else:
            m_res = 0.05
            c_res = max(prices)

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

    def evaluate_signal(self, current_price: float, trendlines: Dict[str, Any], swings: List[Dict[str, Any]], ema_fast: float, ema_slow: float) -> Dict[str, Any]:
        """Generates Falcon Strategy LONG, SHORT, or HOLD signal with Risk Management SL/TP."""
        res_val = trendlines["resistance"]["current_val"]
        sup_val = trendlines["support"]["current_val"]

        signal_type = "HOLD"
        confidence = 70.0
        stop_loss = current_price
        take_profit = current_price

        # Falcon Bullish Breakout with EMA Fast > Slow Confirmation
        if current_price >= res_val or (ema_fast > ema_slow and current_price > ((res_val + sup_val) / 2)):
            signal_type = "LONG_ENTRY"
            confidence = min(98.5, 88.0 + ((current_price - sup_val) / sup_val * 500))
            stop_loss = round(sup_val * 0.998, 2)
            take_profit = round(current_price + (current_price - sup_val) * 2.0, 2)

        # Falcon Bearish Breakdown with EMA Fast < Slow Confirmation
        elif current_price <= sup_val or (ema_fast < ema_slow and current_price < ((res_val + sup_val) / 2)):
            signal_type = "SHORT_ENTRY"
            confidence = min(98.5, 88.0 + ((res_val - current_price) / res_val * 500))
            stop_loss = round(res_val * 1.002, 2)
            take_profit = round(current_price - (res_val - current_price) * 2.0, 2)

        return {
            "signal": signal_type,
            "confidence": round(confidence, 1),
            "current_price": current_price,
            "resistance_level": res_val,
            "support_level": sup_val,
            "ema_fast": ema_fast,
            "ema_slow": ema_slow,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "risk_reward_ratio": 2.0 if signal_type != "HOLD" else 0.0
        }
