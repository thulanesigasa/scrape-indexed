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
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-emerald-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Title with Poppins Bold Typography & 30% Emerald Green Accent */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-poppinsBold flex items-center gap-2">
              <span className="text-emerald-700">Falcon Strategy</span> Analysis Terminal
            </h1>
            <p className="text-xs text-slate-500 font-calibri tracking-wide">
              Real-Time DOM CDP Extractor & 60-30-10 Mathematical Engine
            </p>
          </div>
        </div>

        {/* Status Indicators Styled with 60-30-10 Ratio & Poppins Font */}
        <div className="flex items-center gap-3 font-poppins">
          {/* Symbol Pill */}
          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-2 shadow-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-calibri text-slate-900 font-bold">{symbol}</span>
          </div>

          {/* CDP Connection Status (30% Green) */}
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-xs font-semibold border border-emerald-200 flex items-center gap-2 shadow-xs">
            <Cpu className={`w-3.5 h-3.5 ${cdpConnected ? "text-emerald-600" : "text-amber-500"}`} />
            <span className="text-slate-500 font-calibri">CDP:</span>
            <span className={cdpConnected ? "text-emerald-700 font-bold" : "text-amber-600 font-bold"}>
              {cdpConnected ? "CONNECTED" : "STANDBY"}
            </span>
          </div>

          {/* WebSocket Stream Status (10% Red Accent Highlight for Alert Status) */}
          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-600 animate-pulse" : "text-red-500"}`} />
            <span className="text-slate-500 font-calibri">WS:</span>
            <span className={isConnected ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
