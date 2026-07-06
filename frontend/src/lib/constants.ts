export const API_BASE = "http://localhost:8001";

export const INDIA_CENTER: [number, number] = [78.5, 22.5];
export const INDIA_ZOOM = 5.5;

export const RISK_COLORS = {
  low: "#16a34a",
  moderate: "#eab308",
  high: "#f97316",
  extreme: "#dc2626",
} as const;

export const RISK_TIERS = [
  { label: "Low", key: "low", range: "0–20%" },
  { label: "Moderate", key: "moderate", range: "20–40%" },
  { label: "High", key: "high", range: "40–65%" },
  { label: "Extreme", key: "extreme", range: "65%+" },
] as const;

export const PANEL =
  "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 rounded-lg";

export const PANEL_LABEL =
  "text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500";

export const PANEL_TEXT = "text-xs text-zinc-700 dark:text-zinc-300";

export const PANEL_MUTED = "text-xs text-zinc-400 dark:text-zinc-500";
