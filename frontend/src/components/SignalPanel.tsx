"use client";

import React from "react";
import { SignalPayload } from "../lib/types";
import { Zap, AlertTriangle, Target, ArrowUpRight, ArrowDownRight, MinusCircle, ShieldCheck } from "lucide-react";

interface SignalPanelProps {
  signal?: SignalPayload;
}

export function SignalPanel({ signal }: SignalPanelProps) {
  const signalType = signal?.type || "NEUTRAL";
  const entry = signal?.entry || 0;
  const stopLoss = signal?.stop_loss || 0;
  const target = signal?.target || 0;

  const isLong = signalType === "LONG";
  const isShort = signalType === "SHORT";

  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-border">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amberAccent" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Falcon Signal Breakout Alert Engine
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">Live Stream</span>
      </div>

      {/* Main Signal Banner */}
      <div
        className={`p-4 rounded-lg flex items-center justify-between border transition-all duration-300 ${
          isLong
            ? "badge-long animate-pulse"
            : isShort
            ? "badge-short animate-pulse"
            : "badge-hold"
        }`}
      >
        <div className="flex items-center gap-3">
          {isLong && <ArrowUpRight className="w-7 h-7 text-emeraldAccent shrink-0" />}
          {isShort && <ArrowDownRight className="w-7 h-7 text-roseAccent shrink-0" />}
          {!isLong && !isShort && <MinusCircle className="w-7 h-7 text-amberAccent shrink-0" />}
          <div>
            <div className="text-xs font-mono opacity-80 uppercase">Breakout Signal</div>
            <div className="text-lg font-extrabold tracking-wider font-mono">
              {signalType}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono opacity-80 uppercase">Trigger Entry</div>
          <div className="text-lg font-bold font-mono text-slate-100">
            ${entry > 0 ? entry.toFixed(2) : "---"}
          </div>
        </div>
      </div>

      {/* Target Parameters Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-roseAccent" />
            <span>Stop Loss Level</span>
          </div>
          <div className="text-sm font-bold text-roseAccent">
            ${stopLoss > 0 ? stopLoss.toFixed(2) : "---"}
          </div>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emeraldAccent" />
            <span>Take Profit Target</span>
          </div>
          <div className="text-sm font-bold text-emeraldAccent">
            ${target > 0 ? target.toFixed(2) : "---"}
          </div>
        </div>
      </div>

      {/* Execution Summary Footer */}
      <div className="p-3 rounded-lg glass-card border border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyanAccent" />
          <span>Risk Parameters:</span>
        </div>
        <span className="text-slate-200">
          {isLong ? "Bullish Trendline Break" : isShort ? "Bearish Trendline Break" : "Awaiting Trendline Range Breakout"}
        </span>
      </div>
    </div>
  );
}
