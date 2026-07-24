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
import { CandleData, TrendlineCoord, SignalEventData } from "../lib/types";
import { LineChart, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TradingChartProps {
  candles?: CandleData[];
  trendlines?: TrendlineCoord[];
  historicalSignals?: SignalEventData[];
  currentPrice?: number;
}

export function TradingChart({ candles = [], trendlines = [], historicalSignals = [], currentPrice }: TradingChartProps) {
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

  const minVal = Math.min(...candles.map((c) => c.low), currentPrice || 65240) * 0.998;
  const maxVal = Math.max(...candles.map((c) => c.high), currentPrice || 65240) * 1.002;

  const pastBreakoutTrendlines = historicalSignals
    .filter((sig) => sig.broken_trendline && sig.broken_trendline.y2)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-5">
      {/* Chart Header using Poppins Bold (30% Green / 10% Red Accents) */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 font-poppinsBold">
              Falcon Trendline Visualizer
            </h2>
            <p className="text-xs text-slate-500 font-calibri">
              Linear Regression Support (30% Green) & Resistance (10% Red)
            </p>
          </div>
        </div>

        {/* Legend Metrics with Calibri Font */}
        <div className="flex items-center gap-4 text-xs font-calibri font-bold">
          <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span>Resistance: ${resCoord?.y2.toFixed(2) || "---"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>Support: ${supCoord?.y2.toFixed(2) || "---"}</span>
          </div>
        </div>
      </div>

      {/* Chart Area on 60% White Base Surface */}
      <div className="h-[360px] w-full relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(5, 150, 105, 0.08)" />
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
                  backgroundColor: "#ffffff",
                  borderColor: "rgba(5, 150, 105, 0.2)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                  color: "#0f172a",
                  fontFamily: "Calibri, sans-serif",
                }}
              />

              {/* Faded Historical Breakout Lines */}
              {pastBreakoutTrendlines.map((sig, idx) => {
                const isBull = sig.type === "LONG";
                const strokeColor = isBull ? "#05966966" : "#ef444466";
                const yVal = sig.broken_trendline?.y2 || sig.entry;
                return (
                  <ReferenceLine
                    key={`hist-${idx}`}
                    y={yVal}
                    stroke={strokeColor}
                    strokeWidth={1.5}
                    strokeDasharray="2 4"
                    label={{
                      value: `Past ${sig.type} Break ($${yVal.toFixed(1)})`,
                      fill: isBull ? "#047857" : "#dc2626",
                      fontSize: 9,
                      position: isBull ? "bottom" : "top",
                    }}
                  />
                );
              })}

              {/* Price Line (30% Green Main Line) */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                name="Close Price"
              />

              {/* Resistance Trendline (10% Red) */}
              {resCoord && (
                <ReferenceLine
                  y={resCoord.y2}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: `Resistance ($${resCoord.y2.toFixed(1)})`, fill: "#dc2626", fontSize: 10, position: "top" }}
                />
              )}

              {/* Support Trendline (30% Green) */}
              {supCoord && (
                <ReferenceLine
                  y={supCoord.y2}
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: `Support ($${supCoord.y2.toFixed(1)})`, fill: "#047857", fontSize: 10, position: "bottom" }}
                />
              )}

              {/* Live Price Reference Line */}
              {currentPrice && (
                <ReferenceLine
                  y={currentPrice}
                  stroke="#2563eb"
                  strokeDasharray="2 2"
                  label={{ value: `Tick: $${currentPrice.toFixed(2)}`, fill: "#2563eb", fontSize: 10, position: "left" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-calibri gap-2">
            <Activity className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Awaiting Real-Time Analytical WebSocket Stream...</span>
          </div>
        )}
      </div>
    </div>
  );
}
