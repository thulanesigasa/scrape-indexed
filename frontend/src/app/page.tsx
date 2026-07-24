"use client";

import React from "react";
import { Header } from "../components/Header";
import { TradingChart } from "../components/TradingChart";
import { SignalPanel } from "../components/SignalPanel";
import { SystemStatus } from "../components/SystemStatus";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header
        isConnected={true}
        symbol="BTC/USDT"
        cdpConnected={true}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Visualizer (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TradingChart history={[]} />
        </div>

        {/* Right Sidebar: Phase 1 Browser Automation Telemetry & Signal Panel (1 Col) */}
        <div className="flex flex-col gap-6">
          <SystemStatus />
          <SignalPanel />
        </div>
      </div>
    </main>
  );
}
