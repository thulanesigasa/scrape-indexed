import asyncio
import time
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.automation.cdp_extractor import cdp_extractor
from src.utils.logger import logger

app = FastAPI(
    title="Falcon Strategy Algorithmic Trading & DOM Extractor API",
    version="2.0.0",
    description="Real-Time WebSocket pipeline broadcasting Chrome CDP connection status & Falcon Strategy trading stream."
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
    """Manages active WebSocket connections for status and trading stream endpoints."""
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
        logger.info(f"Trading stream WebSocket client connected. Total clients: {len(self.trading_connections)}")

    def disconnect_trading(self, websocket: WebSocket):
        if websocket in self.trading_connections:
            self.trading_connections.remove(websocket)
            logger.info(f"Trading stream WebSocket client disconnected. Total clients: {len(self.trading_connections)}")

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
    logger.info("Starting up WebSocket server background broadcast loops...")
    asyncio.create_task(broadcast_system_status_loop())
    asyncio.create_task(broadcast_trading_stream_loop())

async def broadcast_system_status_loop():
    """Periodically broadcasts CDP system connection status to /ws/system-status."""
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
    Periodically extracts price tick, computes Falcon Engine math,
    and broadcasts trading payload to /ws/trading-stream subscribers.
    """
    while True:
        try:
            payload = await cdp_extractor.extract_next_tick()
            await manager.broadcast_trading(payload)
        except Exception as e:
            logger.error(f"Error in trading stream broadcast loop: {e}")
        await asyncio.sleep(0.5)

@app.get("/api/health")
async def health_check():
    status = await cdp_extractor.get_system_status()
    return {
        "service": "falcon-algo-trader-backend",
        "status": "ONLINE",
        "cdp_extractor": status
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
    WebSocket endpoint broadcasting real-time price ticks, candles, trendline coordinates, and signals.
    """
    await manager.connect_trading(websocket)
    try:
        # Send immediate tick payload upon connection
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
