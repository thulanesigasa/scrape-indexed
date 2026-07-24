"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ConnectionState, SystemStatusPayload } from "./types";

interface UseFalconStreamOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectIntervalMs?: number;
}

export function useFalconStream(options: UseFalconStreamOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_STATUS_URL || "ws://localhost:8000/ws/system-status",
    autoReconnect = true,
    reconnectIntervalMs = 2000,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("closed");
  const [systemStatus, setSystemStatus] = useState<SystemStatusPayload | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionState("open");
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        const startTime = performance.now();
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "SYSTEM_STATUS") {
            setSystemStatus(payload as SystemStatusPayload);
          }
          setLatencyMs(Math.round(performance.now() - startTime));
        } catch (err) {
          console.error("[useFalconStream] Failed to parse WebSocket JSON payload:", err);
        }
      };

      ws.onerror = (error) => {
        if (!isMountedRef.current) return;
        console.warn("[useFalconStream] WebSocket encountered error:", error);
        setConnectionState("error");
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setConnectionState("closed");
        wsRef.current = null;

        if (autoReconnect && isMountedRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectIntervalMs);
        }
      };
    } catch (err) {
      console.error("[useFalconStream] Failed to instantiate WebSocket:", err);
      setConnectionState("error");
      if (autoReconnect && isMountedRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, reconnectIntervalMs);
      }
    }
  }, [url, autoReconnect, reconnectIntervalMs]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connectionState,
    systemStatus,
    latencyMs,
    isConnected: connectionState === "open" && systemStatus?.status === "Connected",
    browserStatus: systemStatus?.status || "Disconnected",
    activeUrl: systemStatus?.url || "N/A",
    domState: systemStatus?.dom_state || "unreachable",
    error: systemStatus?.error || null,
  };
}
