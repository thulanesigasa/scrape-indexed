import asyncio
import os
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from src.utils.logger import logger
from src.automation.cdp_extractor import CDPDOMExtractor
from src.strategy.falcon_engine import FalconStrategyEngine
from src.api.websocket_server import manager

app = FastAPI(
    title="Falcon Strategy Algorithmic Trading Microservice",
    version="1.0.0",
    description="Real-time DOM Extraction via CDP & Falcon Trendline Signal Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cdp_extractor = CDPDOMExtractor(cdp_url=os.getenv("CDP_URL", "ws://localhost:9222"))
strategy_engine = FalconStrategyEngine()

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Falcon Strategy Microservice...")
    await cdp_extractor.connect_cdp()
    asyncio.create_task(background_tick_producer())

async def background_tick_producer():
    """Continuously extracts DOM/simulated ticks, computes Falcon strategy math, and broadcasts over WebSockets."""
    async for tick in cdp_extractor.stream_ticks(interval_sec=0.4):
        swings, trendlines, signal = strategy_engine.push_tick(tick)
        
        payload = {
            "type": "TICK_UPDATE",
            "tick": tick,
            "swings": swings,
            "trendlines": trendlines,
            "signal": signal
        }
        await manager.broadcast(payload)

@app.get("/api/health")
async def health_check():
    return {
        "status": "ONLINE",
        "service": "falcon-algo-trader-backend",
        "cdp_connected": cdp_extractor.is_connected,
        "history_ticks": len(strategy_engine.ticks_history)
    }

@app.get("/api/strategy-info")
async def get_strategy_info():
    return {
        "strategy": "Falcon Strategy",
        "parameters": {
            "swing_window": strategy_engine.swing_window,
            "max_history": strategy_engine.max_history
        },
        "description": "Automated trendline mapping & swing high/low break signal generator."
    }

@app.websocket("/ws/market-stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
