"use client";

import React from "react";
import { useFalconStream } from "../lib/useFalconStream";
import { Header } from "../components/Header";
import { TradingChart } from "../components/TradingChart";
import { SignalPanel } from "../components/SignalPanel";
import { SystemStatus } from "../components/SystemStatus";

export default function Home() {
  const { history, isConnected, latencyMs, tick, swings, trendlines, signal } = useFalconStream();

  return (
    <main className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header
        isConnected={isConnected}
        symbol={tick?.symbol || "BTC/USDT"}
        cdpConnected={tick?.cdp_connected}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trading Chart (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TradingChart
            history={history}
            trendlines={trendlines}
            swings={swings}
            currentPrice={tick?.price}
          />
        </div>

        {/* Right Sidebar: Falcon Signals & Engine Telemetry (1 Col) */}
        <div className="flex flex-col gap-6">
          <SignalPanel signal={signal} />
          <SystemStatus
            isConnected={isConnected}
            latencyMs={latencyMs}
            tickId={tick?.tick_id}
            cdpConnected={tick?.cdp_connected}
          />
        </div>
      </div>
    </main>
  );
}
