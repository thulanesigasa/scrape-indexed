import asyncio
import time
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.automation.cdp_extractor import cdp_extractor
from src.utils.logger import logger

app = FastAPI(
    title="Falcon Strategy Algorithmic Trading & DOM Extractor API",
    version="1.1.0",
    description="Real-Time WebSocket pipeline broadcasting Chrome CDP connection status & market strategy signals (Phase 1 & Phase 2)."
)

# CORS configuration for local Next.js frontend development server
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
    """Manages active WebSocket connections for status and streaming endpoints."""
    def __init__(self):
        self.status_connections: List[WebSocket] = []
        self.market_connections: List[WebSocket] = []

    async def connect_status(self, websocket: WebSocket):
        await websocket.accept()
        self.status_connections.append(websocket)
        logger.info(f"System status WebSocket client connected. Total clients: {len(self.status_connections)}")

    def disconnect_status(self, websocket: WebSocket):
        if websocket in self.status_connections:
            self.status_connections.remove(websocket)
            logger.info(f"System status WebSocket client disconnected. Total clients: {len(self.status_connections)}")

    async def broadcast_status(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.status_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect_status(conn)

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up WebSocket server background broadcast loops...")
    asyncio.create_task(broadcast_system_status_loop())

async def broadcast_system_status_loop():
    """
    Periodically checks Chrome CDP status and broadcasts status payload to /ws/system-status subscribers.
    """
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
    """
    WebSocket endpoint broadcasting real-time browser connection status and DOM readiness.
    """
    await manager.connect_status(websocket)
    try:
        # Send immediate initial status payload upon connection
        initial_status = await cdp_extractor.get_system_status()
        await websocket.send_json({
            "type": "SYSTEM_STATUS",
            "timestamp": time.time(),
            **initial_status
        })

        while True:
            # Keep WebSocket connection open, receiving heartbeats if sent
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
    except WebSocketDisconnect:
        manager.disconnect_status(websocket)
    except Exception as e:
        logger.error(f"WebSocket /ws/system-status error: {e}")
        manager.disconnect_status(websocket)
