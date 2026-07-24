import os
import json
import sqlite3
import logging
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "falcon_analytics.db")
JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "signals_log.json")

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "filename": record.filename,
            "line": record.lineno
        }
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_data.update(record.extra)
        return json.dumps(log_data)

def setup_logger(name: str = "falcon_backend", level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
    return logger

logger = setup_logger()

class AnalyticalSignalLogger:
    """
    SQLite and JSON persistent logger tracking historical breakout signals,
    trendline coordinates, and maximum favorable excursions without trade execution.
    """
    def __init__(self, db_path: str = DB_PATH, json_path: str = JSON_PATH):
        self.db_path = db_path
        self.json_path = json_path
        self._init_db()

    def _init_db(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS signal_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    datetime_utc TEXT NOT NULL,
                    signal_type TEXT NOT NULL,
                    entry_price REAL NOT NULL,
                    stop_loss REAL NOT NULL,
                    target REAL NOT NULL,
                    broken_trendline_type TEXT,
                    broken_trendline_y2 REAL,
                    max_favorable_excursion REAL DEFAULT 0.0
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trendline_shifts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    resistance_y2 REAL NOT NULL,
                    support_y2 REAL NOT NULL
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to initialize SQLite analytics database: {e}")

    def log_signal(self, signal_event: Dict[str, Any]):
        """Logs a generated SignalEvent to SQLite database and appends to JSON log file."""
        if signal_event.get("type") == "NEUTRAL":
            return

        ts = signal_event.get("timestamp", datetime.utcnow().timestamp())
        dt_str = datetime.utcfromtimestamp(ts).isoformat() + "Z"
        sig_type = signal_event.get("type", "NEUTRAL")
        entry = signal_event.get("entry", 0.0)
        sl = signal_event.get("stop_loss", 0.0)
        target = signal_event.get("target", 0.0)
        broken_type = signal_event.get("broken_trendline_type", "N/A")
        broken_val = signal_event.get("broken_trendline_y2", 0.0)

        # 1. SQLite Persistent Insert
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO signal_events 
                (timestamp, datetime_utc, signal_type, entry_price, stop_loss, target, broken_trendline_type, broken_trendline_y2)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (ts, dt_str, sig_type, entry, sl, target, broken_type, broken_val))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error logging signal event to SQLite: {e}")

        # 2. Append to JSON Log File
        try:
            logs = []
            if os.path.exists(self.json_path):
                with open(self.json_path, "r") as f:
                    try:
                        logs = json.load(f)
                    except Exception:
                        logs = []
            
            logs.append({
                "timestamp": ts,
                "datetime_utc": dt_str,
                "signal_type": sig_type,
                "entry_price": entry,
                "stop_loss": sl,
                "target": target,
                "broken_trendline": {"type": broken_type, "y2": broken_val}
            })
            
            with open(self.json_path, "w") as f:
                json.dump(logs[-100:], f, indent=2)
        except Exception as e:
            logger.error(f"Error writing signal to JSON log file: {e}")

    def fetch_historical_signals(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves recent historical signal events for frontend visualization."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT timestamp, datetime_utc, signal_type, entry_price, stop_loss, target, broken_trendline_type, broken_trendline_y2, max_favorable_excursion
                FROM signal_events ORDER BY id DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            conn.close()

            return [
                {
                    "timestamp": r[0],
                    "datetime_utc": r[1],
                    "signal_type": r[2],
                    "entry_price": r[3],
                    "stop_loss": r[4],
                    "target": r[5],
                    "broken_trendline_type": r[6],
                    "broken_trendline_y2": r[7],
                    "max_favorable_excursion": r[8]
                }
                for r in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching historical signals: {e}")
            return []

signal_logger = AnalyticalSignalLogger()
