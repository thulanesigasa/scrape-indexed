export type ConnectionState = "connecting" | "open" | "closed" | "error";

export interface SystemStatusPayload {
  type: "SYSTEM_STATUS";
  timestamp: number;
  status: "Connected" | "Disconnected";
  url: string;
  title?: string;
  dom_state: string;
  cdp_url: string;
  error?: string | null;
}

export interface CandleData {
  index: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TrendlineCoord {
  type: "resistance" | "support";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SignalPayload {
  type: "LONG" | "SHORT" | "NEUTRAL";
  entry: number;
  stop_loss: number;
  target: number;
}

export interface TradingStreamPayload {
  timestamp: number;
  price: number;
  candles: CandleData[];
  trendlines: TrendlineCoord[];
  signal: SignalPayload;
}
