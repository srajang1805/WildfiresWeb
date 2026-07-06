"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/constants";

export interface HeatPoint {
  lat: number;
  lon: number;
  risk: number;
}

interface HeatmapResponse {
  points: HeatPoint[];
  cached: boolean;
  generated_at: string;
}

async function fetchHeatmap(): Promise<HeatmapResponse> {
  const res = await fetch(`${API_BASE}/api/v1/heatmap`);
  if (!res.ok) throw new Error("Failed to fetch heatmap");
  return res.json();
}

export function useHeatmap() {
  return useQuery({
    queryKey: ["heatmap"],
    queryFn: fetchHeatmap,
    staleTime: 60_000 * 5,
    refetchInterval: 60_000 * 15,
  });
}
