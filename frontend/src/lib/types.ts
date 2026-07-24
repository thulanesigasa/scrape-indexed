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

export interface MarketTick {
  symbol: string;
  timestamp: number;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  tick_id: number;
  cdp_connected: boolean;
}

export interface SwingPivot {
  index: number;
  price: number;
  type: "SWING_HIGH" | "SWING_LOW";
}

export interface TrendlineSpec {
  slope: number;
  intercept: number;
  current_val: number;
}

export interface TrendlinesData {
  resistance: TrendlineSpec;
  support: TrendlineSpec;
}

export interface FalconSignal {
  signal: "LONG_ENTRY" | "SHORT_ENTRY" | "HOLD";
  confidence: number;
  current_price: number;
  resistance_level: number;
  support_level: number;
  ema_fast?: number;
  ema_slow?: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
}
