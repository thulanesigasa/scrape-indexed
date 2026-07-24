# Falcon Strategy Algorithmic Trading Platform (`falcon-algo-trader`)

High-frequency, low-latency MVP for automated trading applying the **Falcon Strategy** (automated trendline mapping, swing high/low pivot calculations, long/short signal generation).

## Stack Overview
- **Backend / Engine**: Python 3.11, FastAPI, Playwright (Remote CDP connection for DOM extraction), Pandas, NumPy, WebSockets.
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React (Zero Emojis), Recharts real-time trading visualization.
- **Infrastructure**: Docker & Docker Compose orchestrator, GitHub Actions CI/CD pipelines.

## Project Structure
```plaintext
falcon-algo-trader/
├── .github/workflows/       # CI/CD pipelines
├── backend/                 # Python trading & DOM extraction engine
│   ├── src/
│   │   ├── automation/      # Playwright browser attachment & Remote CDP reader
│   │   ├── strategy/        # Falcon trendline math & signal generator
│   │   ├── api/             # FastAPI WebSocket/REST endpoints
│   │   └── utils/           # System logging & error boundaries
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py              # Microservice entry point
├── frontend/                # Next.js Trading Terminal UI
│   ├── src/
│   │   ├── app/             # App router dashboard
│   │   ├── components/      # Glassmorphism UI & charting components
│   │   └── lib/             # WebSocket stream clients & types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Local orchestrator
└── README.md
```

## Quick Start
```bash
# Clone the repository
git clone git@github.com:thulanesigasa/falcon-algo-trader.git
cd falcon-algo-trader

# Start using Docker Compose
docker compose up --build
```
- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:3000`
