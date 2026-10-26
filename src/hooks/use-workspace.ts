"use client";

import { useState, useCallback, useEffect } from "react";
import type { DashboardData, RequestStatus, NewRequest, AlertSettings } from "@/lib/types";

export function useWorkspace(initialData: DashboardData) {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/requests", { cache: "no-store" });
      if (!response.ok) throw new Error("Connection lost");
      const result: DashboardData = await response.json();
      setData(result);
      setConnected(true);
      setLastSynced(new Date());
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => { void refresh(); }, 4000);
    const onVisibility = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refresh]);

  const updateStatus = useCallback(async (id: string, status: RequestStatus, actor: string) => {
    const response = await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, actor }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not update this request.");
    setData((current) => ({ ...current, requests: current.requests.map((item) => item.id === id ? result : item) }));
    await refresh();
  }, [refresh]);

  const createRequest = useCallback(async (request: NewRequest) => {
    const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not send this request.");
    setData((current) => ({ ...current, requests: [result, ...current.requests] }));
    await refresh();
    return result;
  }, [refresh]);

  const saveSettings = useCallback(async (settings: AlertSettings) => {
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save alert settings.");
    setData((current) => ({ ...current, settings: result }));
    await refresh();
  }, [refresh]);

  return { data, connected, lastSynced, refresh, updateStatus, createRequest, saveSettings };
}
