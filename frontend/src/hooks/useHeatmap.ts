"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/constants";

export interface HeatPoint { lat: number; lon: number; risk: number }

async function fetchHeatmap() {
  const res = await fetch(api("/api/v1/heatmap"));
  if (!res.ok) throw new Error("Failed to fetch heatmap");
  return res.json();
}

export function useHeatmap() {
  return useQuery({
    queryKey: ["heatmap"],
    queryFn: fetchHeatmap,
    staleTime: 120_000,
    refetchInterval: 300_000,
  });
}
