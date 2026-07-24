"use client";

import React from "react";
import { Activity, ShieldAlert, Cpu, Radio, LineChart } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  symbol?: string;
  cdpConnected?: boolean;
}

export function Header({ isConnected, symbol = "BTC/USDT", cdpConnected = false }: HeaderProps) {
  return (
    <header className="w-full glass-panel px-6 py-4 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20">
          <LineChart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Falcon Strategy Trading Terminal
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            High-Frequency DOM CDP Extractor & Trendline Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Symbol badge */}
        <div className="px-3 py-1.5 rounded-md glass-card text-xs font-mono text-slate-200 border border-white/10 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyanAccent" />
          <span>{symbol}</span>
        </div>

        {/* CDP Connection Status */}
        <div className="px-3 py-1.5 rounded-md glass-card text-xs font-mono flex items-center gap-2">
          <Cpu className={`w-3.5 h-3.5 ${cdpConnected ? "text-emeraldAccent" : "text-amberAccent"}`} />
          <span className="text-slate-300">CDP Stream:</span>
          <span className={cdpConnected ? "text-emeraldAccent font-semibold" : "text-amberAccent font-semibold"}>
            {cdpConnected ? "LIVE BROWSER" : "SIMULATION"}
          </span>
        </div>

        {/* WebSocket Stream Status */}
        <div className="px-3 py-1.5 rounded-md glass-card text-xs font-mono flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emeraldAccent animate-pulse" : "text-roseAccent"}`} />
          <span className="text-slate-300">Engine WS:</span>
          <span className={isConnected ? "text-emeraldAccent font-semibold" : "text-roseAccent font-semibold"}>
            {isConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </header>
  );
}
