"use client";

import React from "react";
import { Activity, Cpu, Radio, LineChart } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  symbol?: string;
  cdpConnected?: boolean;
}

export function Header({ isConnected, symbol = "BTC/USDT", cdpConnected = false }: HeaderProps) {
  return (
    <header className="w-full glass-panel border-b border-border px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Title with Portfolio Gradient Glow */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="gradient-text text-glow font-extrabold">Falcon Strategy</span> Trading Terminal
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-wide">
              Real-Time DOM CDP Extractor & Mathematical Analysis Pipeline
            </p>
          </div>
        </div>

        {/* Status Indicators Styled as Portfolio Badges */}
        <div className="flex items-center gap-3">
          {/* Symbol Pill */}
          <div className="px-3.5 py-1.5 rounded-full glass-card text-xs font-mono text-slate-200 border border-white/10 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyanAccent" />
            <span className="font-bold">{symbol}</span>
          </div>

          {/* CDP Connection Status */}
          <div className="px-3.5 py-1.5 rounded-full glass-card text-xs font-mono flex items-center gap-2">
            <Cpu className={`w-3.5 h-3.5 ${cdpConnected ? "text-emeraldAccent" : "text-amberAccent"}`} />
            <span className="text-slate-400">CDP:</span>
            <span className={cdpConnected ? "text-emeraldAccent font-bold" : "text-amberAccent font-bold"}>
              {cdpConnected ? "CONNECTED" : "STANDBY"}
            </span>
          </div>

          {/* WebSocket Stream Status */}
          <div className="px-3.5 py-1.5 rounded-full glass-card text-xs font-mono flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emeraldAccent animate-pulse" : "text-roseAccent"}`} />
            <span className="text-slate-400">WS:</span>
            <span className={isConnected ? "text-emeraldAccent font-bold" : "text-roseAccent font-bold"}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
