"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/constants";

export interface Alert {
  key: string;
  zone_id: string;
  zone_name: string;
  state: string;
  lat: number;
  lon: number;
  brightness: number;
  frp: number;
  confidence: string;
  date: string;
  detected_at: string;
  status: string;
}

export interface ZoneSummary {
  zone_id: string;
  zone_name: string;
  state: string;
  alert_count: number;
  max_frp: number;
  high_confidence: number;
  status: "safe" | "watch" | "active";
}

async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(api("/api/v1/alerts?limit=20"));
  if (!res.ok) throw new Error("Failed to fetch alerts");
  const data = await res.json();
  return data.alerts || [];
}

async function fetchSummary(): Promise<ZoneSummary[]> {
  const res = await fetch(api("/api/v1/alerts/summary"));
  if (!res.ok) throw new Error("Failed to fetch alert summary");
  const data = await res.json();
  return data.zones || [];
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAlertSummary() {
  return useQuery({
    queryKey: ["alerts-summary"],
    queryFn: fetchSummary,
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 1,
  });
}
