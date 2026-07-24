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

export interface MarketStreamPayload {
  type: "TICK_UPDATE";
  tick: MarketTick;
  swings: SwingPivot[];
  trendlines: TrendlinesData;
  signal: FalconSignal;
}
