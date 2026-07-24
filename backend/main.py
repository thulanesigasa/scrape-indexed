import os
import sys
import uvicorn

# Ensure backend directory is in sys.path for clean import resolution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api.websocket_server import app

if __name__ == "__main__":
    uvicorn.run("src.api.websocket_server:app", host="0.0.0.0", port=8000, reload=False)
