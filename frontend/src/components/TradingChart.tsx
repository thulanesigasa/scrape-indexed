"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { MarketTick, TrendlinesData, SwingPivot } from "../lib/types";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";

interface TradingChartProps {
  history: MarketTick[];
  trendlines?: TrendlinesData;
  swings?: SwingPivot[];
  currentPrice?: number;
}

export function TradingChart({ history, trendlines, swings = [], currentPrice }: TradingChartProps) {
  const chartData = history.map((t, idx) => ({
    time: new Date(t.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: t.price,
    bid: t.bid,
    ask: t.ask,
    resistance: trendlines?.resistance.current_val || t.price * 1.005,
    support: trendlines?.support.current_val || t.price * 0.995,
  }));

  const minPrice = Math.min(...history.map((h) => h.price), trendlines?.support.current_val || 65000) * 0.998;
  const maxPrice = Math.max(...history.map((h) => h.price), trendlines?.resistance.current_val || 65000) * 1.002;

  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyanAccent" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Falcon Dynamic Trendline Visualizer
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-roseAccent">
            <TrendingUp className="w-4 h-4" />
            <span>Resistance: {trendlines?.resistance.current_val?.toFixed(2) || "---"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emeraldAccent">
            <TrendingDown className="w-4 h-4" />
            <span>Support: {trendlines?.support.current_val?.toFixed(2) || "---"}</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[minPrice || 'auto', maxPrice || 'auto']} stroke="#64748b" fontSize={11} orientation="right" tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Line type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Tick Price" />
              <Line type="linear" dataKey="resistance" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Falcon Resistance" />
              <Line type="linear" dataKey="support" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Falcon Support" />

              {currentPrice && (
                <ReferenceLine y={currentPrice} stroke="#38bdf8" strokeDasharray="2 2" label={{ value: `Live: $${currentPrice}`, fill: "#38bdf8", fontSize: 10, position: "left" }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            Awaiting WebSocket Tick Data Stream...
          </div>
        )}
      </div>
    </div>
  );
}
