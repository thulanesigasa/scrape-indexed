import asyncio
import time
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.automation.cdp_extractor import cdp_extractor
from src.utils.logger import logger, signal_logger

app = FastAPI(
    title="Falcon Strategy Algorithmic Analytical Microservice",
    version="3.0.0",
    description="Real-Time WebSocket analytical pipeline broadcasting market trendlines, breakout signals, and historical accuracy logs."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    """Manages active WebSocket connections for analytical data feeds."""
    def __init__(self):
        self.status_connections: List[WebSocket] = []
        self.trading_connections: List[WebSocket] = []

    async def connect_status(self, websocket: WebSocket):
        await websocket.accept()
        self.status_connections.append(websocket)

    def disconnect_status(self, websocket: WebSocket):
        if websocket in self.status_connections:
            self.status_connections.remove(websocket)

    async def broadcast_status(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.status_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect_status(conn)

    async def connect_trading(self, websocket: WebSocket):
        await websocket.accept()
        self.trading_connections.append(websocket)
        logger.info(f"Analytical WebSocket client connected. Total clients: {len(self.trading_connections)}")

    def disconnect_trading(self, websocket: WebSocket):
        if websocket in self.trading_connections:
            self.trading_connections.remove(websocket)
            logger.info(f"Analytical WebSocket client disconnected. Total clients: {len(self.trading_connections)}")

    async def broadcast_trading(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.trading_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect_trading(conn)

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up analytical WebSocket broadcast loops...")
    asyncio.create_task(broadcast_system_status_loop())
    asyncio.create_task(broadcast_trading_stream_loop())

async def broadcast_system_status_loop():
    """Periodically broadcasts CDP system status to /ws/system-status."""
    while True:
        try:
            status_data = await cdp_extractor.get_system_status()
            payload = {
                "type": "SYSTEM_STATUS",
                "timestamp": time.time(),
                **status_data
            }
            await manager.broadcast_status(payload)
        except Exception as e:
            logger.error(f"Error in system status broadcast loop: {e}")
        await asyncio.sleep(1.0)

async def broadcast_trading_stream_loop():
    """
    Periodically extracts tick price, computes Falcon analytical math,
    and broadcasts consolidated analytical payload (current_signal, active_trendlines, historical_signals, market_bias).
    """
    while True:
        try:
            payload = await cdp_extractor.extract_next_tick()
            await manager.broadcast_trading(payload)
        except Exception as e:
            logger.error(f"Error in trading analytics broadcast loop: {e}")
        await asyncio.sleep(0.5)

@app.get("/api/health")
async def health_check():
    status = await cdp_extractor.get_system_status()
    db_signals = signal_logger.fetch_historical_signals(limit=10)
    return {
        "service": "falcon-algo-trader-backend",
        "status": "ONLINE",
        "cdp_extractor": status,
        "historical_signals_count": len(db_signals)
    }

@app.get("/api/historical-signals")
async def get_historical_signals():
    """REST endpoint returning historical signal logs from SQLite database."""
    return {
        "signals": signal_logger.fetch_historical_signals(limit=50)
    }

@app.websocket("/ws/system-status")
async def websocket_system_status(websocket: WebSocket):
    await manager.connect_status(websocket)
    try:
        initial_status = await cdp_extractor.get_system_status()
        await websocket.send_json({
            "type": "SYSTEM_STATUS",
            "timestamp": time.time(),
            **initial_status
        })
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
    except WebSocketDisconnect:
        manager.disconnect_status(websocket)
    except Exception as e:
        manager.disconnect_status(websocket)

@app.websocket("/ws/trading-stream")
async def websocket_trading_stream(websocket: WebSocket):
    """
    WebSocket endpoint broadcasting real-time price ticks, candles, active trendlines,
    current breakout signal event, and historical signal accuracy records.
    """
    await manager.connect_trading(websocket)
    try:
        initial_payload = await cdp_extractor.extract_next_tick()
        await websocket.send_json(initial_payload)

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
    except WebSocketDisconnect:
        manager.disconnect_trading(websocket)
    except Exception as e:
        logger.error(f"WebSocket /ws/trading-stream error: {e}")
        manager.disconnect_trading(websocket)
