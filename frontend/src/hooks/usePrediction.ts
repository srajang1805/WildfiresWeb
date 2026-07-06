"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/constants";

interface Prediction {
  wildfire_risk: number;
  temperature: number;
  humidity: number;
  wind: number;
}

async function fetchPrediction(lat: number, lon: number): Promise<Prediction> {
  const res = await fetch(`${API_BASE}/api/v1/predict?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

export function usePrediction(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["prediction", lat, lon],
    queryFn: () => fetchPrediction(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 30_000,
  });
}
