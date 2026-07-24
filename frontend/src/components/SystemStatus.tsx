"use client";

import React from "react";
import { Gauge, Wifi, Server, CheckCircle2 } from "lucide-react";

interface SystemStatusProps {
  isConnected: boolean;
  latencyMs: number;
  tickId?: number;
  cdpConnected?: boolean;
}

export function SystemStatus({ isConnected, latencyMs, tickId = 0, cdpConnected = false }: SystemStatusProps) {
  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-emeraldAccent" />
        <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
          Engine Diagnostics & Telemetry
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg glass-card border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Wifi className="w-4 h-4 text-cyanAccent" />
            <span>WS Latency:</span>
          </div>
          <span className="font-bold text-cyanAccent">{latencyMs} ms</span>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Server className="w-4 h-4 text-emeraldAccent" />
            <span>Ticks Extracted:</span>
          </div>
          <span className="font-bold text-slate-200">#{tickId}</span>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex items-center justify-between">
          <span className="text-slate-400">CDP DOM Mode:</span>
          <span className={cdpConnected ? "text-emeraldAccent font-semibold" : "text-amberAccent font-semibold"}>
            {cdpConnected ? "CHROMIUM CDP" : "HIGH-FREQ SIM"}
          </span>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex items-center justify-between">
          <span className="text-slate-400">Health Check:</span>
          <span className="text-emeraldAccent flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASSING
          </span>
        </div>
      </div>
    </div>
  );
}
