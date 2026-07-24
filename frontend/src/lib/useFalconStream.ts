"use client";

import { useEffect, useState, useRef } from "react";
import { MarketStreamPayload, MarketTick, SwingPivot, TrendlinesData, FalconSignal } from "./types";

export function useFalconStream() {
  const [payload, setPayload] = useState<MarketStreamPayload | null>(null);
  const [history, setHistory] = useState<MarketTick[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/market-stream";
    
    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const start = performance.now();
        try {
          const data: MarketStreamPayload = JSON.parse(event.data);
          setPayload(data);
          
          if (data.tick) {
            setHistory((prev) => {
              const updated = [...prev, data.tick];
              return updated.slice(-60); // Keep last 60 ticks for real-time rendering
            });
          }
          setLatencyMs(Math.round(performance.now() - start));
        } catch (err) {
          console.error("Failed to parse WebSocket tick payload", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatic reconnection retry after 2 seconds
        setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    payload,
    history,
    isConnected,
    latencyMs,
    tick: payload?.tick,
    swings: payload?.swings || [],
    trendlines: payload?.trendlines,
    signal: payload?.signal,
  };
}
