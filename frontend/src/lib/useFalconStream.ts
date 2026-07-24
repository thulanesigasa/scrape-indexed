"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ConnectionState, SystemStatusPayload, TradingStreamPayload } from "./types";

interface UseFalconStreamOptions {
  statusUrl?: string;
  tradingUrl?: string;
  autoReconnect?: boolean;
  reconnectIntervalMs?: number;
}

export function useFalconStream(options: UseFalconStreamOptions = {}) {
  const {
    statusUrl = process.env.NEXT_PUBLIC_WS_STATUS_URL || "ws://localhost:8000/ws/system-status",
    tradingUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/trading-stream",
    autoReconnect = true,
    reconnectIntervalMs = 2000,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("closed");
  const [systemStatus, setSystemStatus] = useState<SystemStatusPayload | null>(null);
  const [tradingData, setTradingData] = useState<TradingStreamPayload | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  
  const statusWsRef = useRef<WebSocket | null>(null);
  const tradingWsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    if (statusWsRef.current) statusWsRef.current.close();
    if (tradingWsRef.current) tradingWsRef.current.close();

    setConnectionState("connecting");

    try {
      const statusWs = new WebSocket(statusUrl);
      statusWsRef.current = statusWs;

      statusWs.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionState("open");
      };

      statusWs.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "SYSTEM_STATUS") {
            setSystemStatus(payload as SystemStatusPayload);
          }
        } catch (err) {
          console.error("[useFalconStream] Status WS parse error:", err);
        }
      };

      statusWs.onerror = () => {
        if (!isMountedRef.current) return;
        setConnectionState("error");
      };

      statusWs.onclose = () => {
        if (!isMountedRef.current) return;
        setConnectionState("closed");
      };

      const tradingWs = new WebSocket(tradingUrl);
      tradingWsRef.current = tradingWs;

      tradingWs.onmessage = (event) => {
        if (!isMountedRef.current) return;
        const startTime = performance.now();
        try {
          const payload = JSON.parse(event.data);
          if (payload.candles && payload.trendlines) {
            setTradingData(payload as TradingStreamPayload);
          }
          setLatencyMs(Math.round(performance.now() - startTime));
        } catch (err) {
          console.error("[useFalconStream] Trading WS parse error:", err);
        }
      };

      tradingWs.onclose = () => {
        if (autoReconnect && isMountedRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectIntervalMs);
        }
      };
    } catch (err) {
      console.error("[useFalconStream] Connection init error:", err);
      setConnectionState("error");
    }
  }, [statusUrl, tradingUrl, autoReconnect, reconnectIntervalMs]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (statusWsRef.current) statusWsRef.current.close();
      if (tradingWsRef.current) tradingWsRef.current.close();
    };
  }, [connect]);

  return {
    connectionState,
    systemStatus,
    tradingData,
    latencyMs,
    isConnected: connectionState === "open",
    browserStatus: systemStatus?.status || "Disconnected",
    activeUrl: systemStatus?.url || "N/A",
    domState: systemStatus?.dom_state || "unreachable",
    error: systemStatus?.error || null,
    price: tradingData?.price || 0,
    marketBias: tradingData?.market_bias || "NEUTRAL",
    candles: tradingData?.candles || [],
    trendlines: tradingData?.trendlines || [],
    currentSignal: tradingData?.current_signal || { type: "NEUTRAL", entry: 0, stop_loss: 0, target: 0, timestamp: 0 },
    historicalSignals: tradingData?.historical_signals || [],
  };
}
