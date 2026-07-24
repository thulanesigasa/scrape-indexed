"use client";

import React from "react";
import { useFalconStream } from "../lib/useFalconStream";
import { Cpu, Globe, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";

export function SystemStatus() {
  const {
    connectionState,
    systemStatus,
    isConnected,
    browserStatus,
    activeUrl,
    domState,
    latencyMs,
    error,
  } = useFalconStream();

  // Color & status determination for visual indicators
  let statusColor = "bg-roseAccent"; // Red for Disconnected / Error
  let pingColor = "text-roseAccent";
  let statusLabel = "Disconnected";

  if (connectionState === "connecting") {
    statusColor = "bg-amberAccent animate-ping"; // Yellow for Connecting
    pingColor = "text-amberAccent";
    statusLabel = "Connecting";
  } else if (connectionState === "open") {
    if (browserStatus === "Connected") {
      statusColor = "bg-emeraldAccent animate-pulse"; // Green for Connected
      pingColor = "text-emeraldAccent";
      statusLabel = "Connected";
    } else {
      statusColor = "bg-amberAccent"; // Yellow for WebSocket Open but CDP Standby
      pingColor = "text-amberAccent";
      statusLabel = "CDP Standby";
    }
  }

  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-border">
      {/* Header with Visual Dot Status */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5 items-center justify-center">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                connectionState === "open" && browserStatus === "Connected"
                  ? "bg-emerald-400"
                  : connectionState === "connecting"
                  ? "bg-amber-400"
                  : "bg-rose-500"
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase flex items-center gap-2">
              Browser Automation & CDP Pipeline
            </h3>
            <p className="text-xs text-slate-400 font-mono">FastAPI WebSocket `/ws/system-status`</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border ${
            isConnected
              ? "badge-long"
              : connectionState === "connecting"
              ? "badge-hold"
              : "badge-short"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyanAccent" />
            <span>CDP Status</span>
          </div>
          <div className="font-bold text-slate-200 truncate">{browserStatus}</div>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${pingColor}`} />
            <span>DOM State</span>
          </div>
          <div className="font-bold text-slate-200 capitalize">{domState}</div>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 col-span-2 flex flex-col gap-1">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emeraldAccent" />
            <span>Active Tab URL</span>
          </div>
          <div className="font-bold text-slate-300 truncate" title={activeUrl}>
            {activeUrl}
          </div>
        </div>
      </div>

      {/* Latency & Error Alert */}
      <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emeraldAccent" />
          <span>Stream Latency: <strong className="text-slate-200">{latencyMs} ms</strong></span>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-roseAccent truncate max-w-[200px]" title={error}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
