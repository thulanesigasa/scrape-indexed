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

  let statusBg = "bg-red-50 text-red-700 border-red-200"; // 10% Red Accent for Disconnected
  let dotColor = "bg-red-500";
  let statusLabel = "Disconnected";

  if (connectionState === "connecting") {
    statusBg = "bg-amber-50 text-amber-700 border-amber-200";
    dotColor = "bg-amber-500 animate-ping";
    statusLabel = "Connecting";
  } else if (connectionState === "open") {
    if (browserStatus === "Connected") {
      statusBg = "bg-emerald-50 text-emerald-800 border-emerald-300"; // 30% Green Structure
      dotColor = "bg-emerald-500 animate-pulse";
      statusLabel = "Connected";
    } else {
      statusBg = "bg-amber-50 text-amber-700 border-amber-200";
      dotColor = "bg-amber-500";
      statusLabel = "CDP Standby";
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-4">
      {/* Header with 60-30-10 Dot Status & Poppins Bold */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5 items-center justify-center">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 font-poppinsBold uppercase">
              Browser Automation & CDP Pipeline
            </h3>
            <p className="text-xs text-slate-500 font-calibri">FastAPI WebSocket `/ws/system-status`</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-poppins font-bold uppercase border ${statusBg}`}>
          {statusLabel}
        </span>
      </div>

      {/* System Metrics Grid in Calibri Font */}
      <div className="grid grid-cols-2 gap-3 text-xs font-calibri">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
          <div className="text-slate-500 flex items-center gap-1.5 font-poppins font-medium">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>CDP Status</span>
          </div>
          <div className="font-bold text-slate-900 truncate">{browserStatus}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
          <div className="text-slate-500 flex items-center gap-1.5 font-poppins font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>DOM State</span>
          </div>
          <div className="font-bold text-slate-900 capitalize">{domState}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 flex flex-col gap-1">
          <div className="text-slate-500 flex items-center gap-1.5 font-poppins font-medium">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Tab URL</span>
          </div>
          <div className="font-bold text-slate-700 truncate" title={activeUrl}>
            {activeUrl}
          </div>
        </div>
      </div>

      {/* Telemetry & Error Alert Footer */}
      <div className="flex items-center justify-between text-xs font-calibri text-slate-600 pt-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Stream Latency: <strong className="text-slate-900">{latencyMs} ms</strong></span>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-red-600 truncate max-w-[200px]" title={error}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
