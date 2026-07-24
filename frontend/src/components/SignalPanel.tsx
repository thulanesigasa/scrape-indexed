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

  // Web Audio API tone synthesis for breakout alert sound (no external audio asset required)
  const triggerAudioAlert = (signalType: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // High pitch for LONG breakout (880Hz), lower pitch for SHORT breakdown (440Hz)
      osc.frequency.setValueAtTime(signalType === "LONG" ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Web Audio API alert playback prevented by browser policy:", e);
    }
  };

  // Trigger audio alert when a new breakout signal event arrives
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
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-border">
      {/* Header & Market Bias Indicator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amberAccent" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Analysis & Breakout Alert Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Volume2 className="w-3.5 h-3.5 text-cyanAccent" />
          <span>Alerts Active</span>
        </div>
      </div>

      {/* Market Bias & Current Action Banner */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <span className="text-slate-400 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-cyanAccent" />
            <span>Market Bias</span>
          </span>
          <span
            className={`font-extrabold text-sm tracking-wider uppercase ${
              isBullish
                ? "text-emeraldAccent"
                : isBearish
                ? "text-roseAccent"
                : "text-amberAccent"
            }`}
          >
            {marketBias}
          </span>
        </div>

        <div className="p-3 rounded-lg glass-card border border-white/5 flex flex-col gap-1">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emeraldAccent" />
            <span>Analysis Mode</span>
          </span>
          <span className="font-bold text-slate-200 text-sm">NO AUTO-EXECUTE</span>
        </div>
      </div>

      {/* Current Signal Alert Display */}
      <div
        className={`p-4 rounded-lg flex items-center justify-between border transition-all duration-300 ${
          sigType === "LONG"
            ? "badge-long animate-pulse"
            : sigType === "SHORT"
            ? "badge-short animate-pulse"
            : "badge-hold"
        }`}
      >
        <div className="flex items-center gap-3">
          {sigType === "LONG" && <ArrowUpRight className="w-7 h-7 text-emeraldAccent shrink-0" />}
          {sigType === "SHORT" && <ArrowDownRight className="w-7 h-7 text-roseAccent shrink-0" />}
          {sigType === "NEUTRAL" && <MinusCircle className="w-7 h-7 text-amberAccent shrink-0" />}
          <div>
            <div className="text-xs font-mono opacity-80 uppercase">Active Signal Alert</div>
            <div className="text-lg font-extrabold tracking-wider font-mono">
              {sigType}
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <div className="text-slate-300">Entry: ${currentSignal?.entry?.toFixed(2) || "---"}</div>
          <div className="text-roseAccent">SL: ${currentSignal?.stop_loss?.toFixed(2) || "---"}</div>
          <div className="text-emeraldAccent">TP: ${currentSignal?.target?.toFixed(2) || "---"}</div>
        </div>
      </div>

      {/* Recent Breakouts Historical Log Feed */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold border-b border-white/5 pb-1">
          <History className="w-4 h-4 text-cyanAccent" />
          <span>Recent Breakout History ({historicalSignals.length})</span>
        </div>

        <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1.5 pr-1">
          {historicalSignals.length > 0 ? (
            historicalSignals.map((sig, idx) => (
              <div
                key={idx}
                className="p-2 rounded glass-card border border-white/5 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      sig.type === "LONG" ? "bg-emerald-500/20 text-emeraldAccent" : "bg-rose-500/20 text-roseAccent"
                    }`}
                  >
                    {sig.type}
                  </span>
                  <span className="text-slate-300">${sig.entry.toFixed(2)}</span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>MFE: </span>
                  <span className="text-emeraldAccent font-semibold">+${sig.max_favorable_excursion?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs font-mono text-slate-500 py-3 text-center">
              No recent breakouts recorded in active session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
