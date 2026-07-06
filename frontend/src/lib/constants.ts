const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export function api(path: string): string {
  return `${API_URL}${path}`;
}

export {
  API_URL as API_BASE,
};

export const INDIA_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LON) || 78.5,
  Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT) || 22.5,
];
export const INDIA_ZOOM = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM) || 5.8;

export const PANEL = "bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/80 rounded-xl";

export const RISK_COLORS = {
  low: "#16A34A",
  moderate: "#F59E0B",
  high: "#F97316",
  veryHigh: "#DC2626",
  extreme: "#7C3AED",
} as const;

export const RISK_TIERS = [
  { label: "Low", key: "low", range: "0–20%" },
  { label: "Moderate", key: "moderate", range: "20–40%" },
  { label: "High", key: "high", range: "40–65%" },
  { label: "Very High", key: "veryHigh", range: "65–85%" },
  { label: "Extreme", key: "extreme", range: "85–100%" },
] as const;
