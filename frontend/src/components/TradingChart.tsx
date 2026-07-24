"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { CandleData, TrendlineCoord } from "../lib/types";
import { LineChart, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TradingChartProps {
  candles?: CandleData[];
  trendlines?: TrendlineCoord[];
  currentPrice?: number;
}

export function TradingChart({ candles = [], trendlines = [], currentPrice }: TradingChartProps) {
  const chartData = candles.map((c) => ({
    time: new Date(c.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    index: c.index,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    price: c.close,
  }));

  const resCoord = trendlines.find((t) => t.type === "resistance");
  const supCoord = trendlines.find((t) => t.type === "support");

  const minVal = Math.min(...candles.map((c) => c.low), currentPrice || 65000) * 0.998;
  const maxVal = Math.max(...candles.map((c) => c.high), currentPrice || 65000) * 1.002;

  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Falcon Mathematical Trendline Visualizer
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live Linear Regression Fitting (x1, y1) to (x2, y2)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-roseAccent">
            <TrendingUp className="w-4 h-4" />
            <span>Res Line: ${resCoord?.y2.toFixed(2) || "---"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emeraldAccent">
            <TrendingDown className="w-4 h-4" />
            <span>Sup Line: ${supCoord?.y2.toFixed(2) || "---"}</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                domain={[minVal || "auto", maxVal || "auto"]}
                stroke="#64748b"
                fontSize={11}
                orientation="right"
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              {/* Candlestick Close Line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                name="Close Price"
              />
              {/* Resistance Trendline Overlay */}
              {resCoord && (
                <ReferenceLine
                  y={resCoord.y2}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  label={{ value: `Resistance (${resCoord.y2.toFixed(1)})`, fill: "#f43f5e", fontSize: 10, position: "top" }}
                />
              )}
              {/* Support Trendline Overlay */}
              {supCoord && (
                <ReferenceLine
                  y={supCoord.y2}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  label={{ value: `Support (${supCoord.y2.toFixed(1)})`, fill: "#10b981", fontSize: 10, position: "bottom" }}
                />
              )}
              {/* Live Price Reference Line */}
              {currentPrice && (
                <ReferenceLine
                  y={currentPrice}
                  stroke="#38bdf8"
                  strokeDasharray="2 2"
                  label={{ value: `Tick: $${currentPrice.toFixed(2)}`, fill: "#38bdf8", fontSize: 10, position: "left" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono gap-2">
            <Activity className="w-4 h-4 animate-spin text-cyanAccent" />
            <span>Awaiting Real-Time Trading WebSocket Stream...</span>
          </div>
        )}
      </div>
    </div>
  );
}
