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

export interface SignalEventData {
  type: "LONG" | "SHORT" | "NEUTRAL";
  entry: number;
  stop_loss: number;
  target: number;
  timestamp: number;
  broken_trendline?: TrendlineCoord | null;
  max_favorable_excursion?: number;
}

export interface TradingStreamPayload {
  timestamp: number;
  price: number;
  market_bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  candles: CandleData[];
  trendlines: TrendlineCoord[];
  current_signal: SignalEventData;
  historical_signals: SignalEventData[];
}
