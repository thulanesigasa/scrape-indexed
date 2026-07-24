"use client";

import React, { useEffect, useRef } from "react";
import { SignalEventData } from "../lib/types";
import { Zap, AlertTriangle, Target, ArrowUpRight, ArrowDownRight, MinusCircle, Volume2, ShieldCheck, History, BarChart3 } from "lucide-react";

interface SignalPanelProps {
  currentSignal?: SignalEventData;
  historicalSignals?: SignalEventData[];
  marketBias?: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export function SignalPanel({ currentSignal, historicalSignals = [], marketBias = "NEUTRAL" }: SignalPanelProps) {
  const lastSignalTimeRef = useRef<number>(0);

  const triggerAudioAlert = (signalType: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(signalType === "LONG" ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Web Audio alert sound blocked by browser policy:", e);
    }
  };

  useEffect(() => {
    if (currentSignal && currentSignal.type !== "NEUTRAL") {
      if (currentSignal.timestamp > lastSignalTimeRef.current) {
        lastSignalTimeRef.current = currentSignal.timestamp;
        triggerAudioAlert(currentSignal.type);
      }
    }
  }, [currentSignal]);

  const isBullish = marketBias === "BULLISH";
  const isBearish = marketBias === "BEARISH";
  const sigType = currentSignal?.type || "NEUTRAL";

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-5">
      {/* Header using Poppins Bold Typography */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 font-poppinsBold uppercase">
            Analysis & Breakout Alerts
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-calibri text-slate-500">
          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Audio Active</span>
        </div>
      </div>

      {/* 60-30-10 Market Bias & Safety Status */}
      <div className="grid grid-cols-2 gap-3 text-xs font-calibri">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-emerald-100 flex flex-col gap-1">
          <span className="text-slate-500 flex items-center gap-1.5 font-poppins font-medium">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Market Bias</span>
          </span>
          <span
            className={`font-poppinsBold font-extrabold text-sm tracking-wider uppercase ${
              isBullish
                ? "text-emerald-700"
                : isBearish
                ? "text-red-600"
                : "text-amber-600"
            }`}
          >
            {marketBias}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-emerald-100 flex flex-col gap-1">
          <span className="text-slate-500 flex items-center gap-1.5 font-poppins font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Execution Mode</span>
          </span>
          <span className="font-poppinsBold font-bold text-slate-700 text-xs uppercase">
            ANALYSIS ONLY
          </span>
        </div>
      </div>

      {/* 10% Red Accent Highlight / 30% Green Signal Alert Banner */}
      <div
        className={`p-4 rounded-xl flex items-center justify-between border transition-all duration-300 ${
          sigType === "LONG"
            ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm"
            : sigType === "SHORT"
            ? "bg-red-50 text-red-800 border-red-300 shadow-sm animate-pulse"
            : "bg-slate-50 text-slate-700 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {sigType === "LONG" && <ArrowUpRight className="w-7 h-7 text-emerald-600 shrink-0" />}
          {sigType === "SHORT" && <ArrowDownRight className="w-7 h-7 text-red-600 shrink-0" />}
          {sigType === "NEUTRAL" && <MinusCircle className="w-7 h-7 text-amber-500 shrink-0" />}
          <div>
            <div className="text-xs font-poppins font-medium opacity-80 uppercase">Breakout Signal</div>
            <div className="text-lg font-poppinsBold font-extrabold tracking-wider">
              {sigType}
            </div>
          </div>
        </div>

        <div className="text-right font-calibri text-xs font-bold">
          <div className="text-slate-700">Entry: ${currentSignal?.entry?.toFixed(2) || "---"}</div>
          <div className="text-red-600">SL: ${currentSignal?.stop_loss?.toFixed(2) || "---"}</div>
          <div className="text-emerald-700">TP: ${currentSignal?.target?.toFixed(2) || "---"}</div>
        </div>
      </div>

      {/* Recent Breakout History Feed with Calibri Data Rows */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-poppins font-bold text-slate-800 border-b border-emerald-100 pb-2">
          <History className="w-4 h-4 text-emerald-600" />
          <span>Recent Breakout History ({historicalSignals.length})</span>
        </div>

        <div className="max-h-[160px] overflow-y-auto flex flex-col gap-2 pr-1 font-calibri">
          {historicalSignals.length > 0 ? (
            historicalSignals.map((sig, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-poppins font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      sig.type === "LONG"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    {sig.type}
                  </span>
                  <span className="text-slate-800 font-bold">${sig.entry.toFixed(2)}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span>MFE: </span>
                  <span className="text-emerald-700 font-bold">+${sig.max_favorable_excursion?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs font-calibri text-slate-400 py-3 text-center">
              No recent breakouts logged in session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
