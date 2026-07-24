"use client";

import React from "react";
import { FalconSignal } from "../lib/types";
import { Zap, ShieldCheck, Target, AlertTriangle, ArrowUpRight, ArrowDownRight, MinusCircle } from "lucide-react";

interface SignalPanelProps {
  signal?: FalconSignal;
}

export function SignalPanel({ signal }: SignalPanelProps) {
  const signalType = signal?.signal || "HOLD";
  const confidence = signal?.confidence || 0;
  const price = signal?.current_price || 0;
  const sl = signal?.stop_loss || 0;
  const tp = signal?.take_profit || 0;
  const rr = signal?.risk_reward_ratio || 0;

  const isLong = signalType === "LONG_ENTRY";
  const isShort = signalType === "SHORT_ENTRY";

  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amberAccent" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Falcon Signal Execution Feed
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">Auto-Refreshed</span>
      </div>

      {/* Signal Type Banner */}
      <div
        className={`p-4 rounded-lg flex items-center justify-between border ${
          isLong
            ? "badge-long"
            : isShort
            ? "badge-short"
            : "badge-hold"
        }`}
      >
        <div className="flex items-center gap-3">
          {isLong && <ArrowUpRight className="w-7 h-7 text-emeraldAccent" />}
          {isShort && <ArrowDownRight className="w-7 h-7 text-roseAccent" />}
          {!isLong && !isShort && <MinusCircle className="w-7 h-7 text-amberAccent" />}
          <div>
            <div className="text-xs font-mono opacity-80 uppercase">Target Action</div>
            <div className="text-lg font-extrabold tracking-wider font-mono">
              {signalType}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono opacity-80 uppercase">Model Confidence</div>
          <div className="text-lg font-bold font-mono">{confidence.toFixed(1)}%</div>
        </div>
      </div>

      {/* Risk Parameters Grid */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-roseAccent" />
            <span>Stop Loss (SL)</span>
          </div>
          <div className="text-sm font-bold text-roseAccent">${sl.toFixed(2)}</div>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emeraldAccent" />
            <span>Take Profit (TP)</span>
          </div>
          <div className="text-sm font-bold text-emeraldAccent">${tp.toFixed(2)}</div>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyanAccent" />
            <span>Risk / Reward</span>
          </div>
          <div className="text-sm font-bold text-cyanAccent">1 : {rr.toFixed(1)}</div>
        </div>
      </div>

      {/* Strategy Indicator Metrics */}
      <div className="p-3 rounded-lg glass-card border border-white/5 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400">Fast EMA (9) / Slow EMA (21):</span>
        <span className="text-slate-200">
          ${signal?.ema_fast?.toFixed(2) || "---"} / ${signal?.ema_slow?.toFixed(2) || "---"}
        </span>
      </div>
    </div>
  );
}
