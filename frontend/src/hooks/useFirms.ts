"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/constants";

export interface FirmsDetection {
  lat: number;
  lon: number;
  brightness: number;
  frp: number;
  date: string;
  confidence: string;
}

interface FirmsResponse {
  detections: FirmsDetection[];
  updated: string;
  count: number;
}

async function fetchFirms(): Promise<FirmsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/firms`);
  if (!res.ok) throw new Error("FIRMS fetch failed");
  return res.json();
}

export function useFirms() {
  return useQuery({
    queryKey: ["firms"],
    queryFn: fetchFirms,
    staleTime: 300_000,
    refetchInterval: 600_000,
    retry: 1,
  });
}
