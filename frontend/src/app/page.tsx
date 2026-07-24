"use client";

import React from "react";
import { useFalconStream } from "../lib/useFalconStream";
import { Header } from "../components/Header";
import { TradingChart } from "../components/TradingChart";
import { SignalPanel } from "../components/SignalPanel";
import { SystemStatus } from "../components/SystemStatus";

export default function Home() {
  const {
    isConnected,
    browserStatus,
    price,
    candles,
    trendlines,
    signal,
  } = useFalconStream();

  return (
    <main className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header
        isConnected={isConnected}
        symbol="BTC/USDT"
        cdpConnected={browserStatus === "Connected"}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TradingChart
            candles={candles}
            trendlines={trendlines}
            currentPrice={price}
          />
        </div>

        {/* Sidebar: System Status & Signal Alerts (1 Col) */}
        <div className="flex flex-col gap-6">
          <SystemStatus />
          <SignalPanel signal={signal} />
        </div>
      </div>
    </main>
  );
}
