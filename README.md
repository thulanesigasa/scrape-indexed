# Scrape Indexed (`scrape-indexed`)

High-performance Web Scraping & Real-Time Algorithmic Trading Platform applying the **Falcon Strategy** (automated trendline mapping, DOM Playwright CDP extraction, swing high/low pivot calculations, long/short signal generation).

---

## Technical Stack Overview

### Backend / Engine
- **Language & Runtime**: Python 3.11
- **API Framework**: FastAPI & Uvicorn (ASGI async event loop)
- **DOM Extractor**: Playwright Chromium Remote DevTools Protocol (CDP) client
- **Data & Strategy Engine**: Pandas, NumPy (Linear regression trendlines, local swing maxima/minima windowing, exponential moving averages)
- **Real-Time Transport**: Native WebSockets (`/ws/market-stream`)

### Frontend / User Interface
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS (HSL dark glassmorphic layout)
- **Iconography**: Lucide React SVG Icons (**Zero Emojis Policy**)
- **Visualization**: Recharts real-time tick & trendline chart component

---

## Directory Structure

```plaintext
scrape-indexed/
├── .github/workflows/       # GitHub Actions CI/CD pipelines
│   └── ci.yml
├── backend/                 # Python trading & DOM extraction engine
│   ├── src/
│   │   ├── automation/      # Playwright browser attachment & Remote CDP reader
│   │   │   └── cdp_extractor.py
│   │   ├── strategy/        # Falcon trendline math & signal generator
│   │   │   └── falcon_engine.py
│   │   ├── api/             # FastAPI WebSocket/REST endpoints
│   │   │   └── websocket_server.py
│   │   └── utils/           # System logging & error boundaries
│   │       └── logger.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py              # Microservice entry point
├── frontend/                # Next.js Trading Terminal UI
│   ├── src/
│   │   ├── app/             # App router dashboard
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/      # Glassmorphism UI & charting components
│   │   │   ├── Header.tsx
│   │   │   ├── SignalPanel.tsx
│   │   │   ├── SystemStatus.tsx
│   │   │   └── TradingChart.tsx
│   │   └── lib/             # WebSocket stream clients & types
│   │       ├── types.ts
│   │       └── useFalconStream.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml       # Container orchestrator
└── README.md
```

---

## Running the Application

### Method 1: Local Execution without Docker (Manual Setup)

Running the application manually on your host machine allows for rapid local development and direct debugging.

#### Step 1: Backend Setup (Python)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Install Playwright browser binaries (Chromium):
   ```bash
   playwright install chromium
   ```

5. (Optional) Launch Chrome with Remote Debugging enabled on port `9222`:
   - **Windows**:
     ```powershell
     "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome_dev_profile" https://charts.deriv.com/deriv --remote-debugging-port=9222
     ```
   - **Linux**:
     ```bash
     google-chrome --remote-debugging-port=9222
     ```

6. Start the FastAPI backend server:
   ```bash
   python main.py
   ```
   *The backend server will run on `http://localhost:8000`. WebSocket endpoint is available at `ws://localhost:8000/ws/market-stream`.*

---

#### Step 2: Frontend Setup (Next.js)

1. Open a separate terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional, defaults to local backend):
   Create a `.env.local` file in `frontend/`:
   ```env
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/market-stream
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### Method 2: Docker Compose Setup

If you prefer containerized deployment:

```bash
# From the root directory
docker compose up --build
```
- Backend API: `http://localhost:8000`
- Frontend Terminal UI: `http://localhost:3000`

---

## Strategy & Algorithm Details

### Falcon Strategy Calculation Engine
1. **Swing Pivots (`calculate_swings`)**: Scans historical price ticks to identify local maxima (`SWING_HIGH`) and local minima (`SWING_LOW`) across a symmetrical time window.
2. **Dynamic Trendlines (`compute_trendlines`)**: Performs linear regression ($y = mx + c$) across swing highs to model resistance lines, and swing lows to model support lines.
3. **EMA Trend Confirmation (`compute_ema`)**: Evaluates Fast EMA (9-period) and Slow EMA (21-period) crossovers for trend validation.
4. **Signal Generation (`evaluate_signal`)**: Emits `LONG_ENTRY`, `SHORT_ENTRY`, or `HOLD` signals accompanied by model confidence scores, Stop Loss (SL), Take Profit (TP), and Risk/Reward ratios.
