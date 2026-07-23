"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Flame, MapPin, Navigation } from "lucide-react";
import { PANEL, RISK_COLORS, api } from "@/lib/constants";

interface Hotspot { lat: number; lon: number; risk: number }

function riskColor(r: number): string {
  if (r < 20) return RISK_COLORS.low;
  if (r < 40) return RISK_COLORS.moderate;
  if (r < 65) return RISK_COLORS.high;
  if (r < 85) return RISK_COLORS.veryHigh;
  return RISK_COLORS.extreme;
}

function riskLabel(r: number): string {
  if (r < 20) return "Low";
  if (r < 40) return "Moderate";
  if (r < 65) return "High";
  if (r < 85) return "Very High";
  return "Extreme";
}

export default function TopRisksPanel() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const setViewState = useAppStore((s) => s.setViewState);
  const setSelectedPoint = useAppStore((s) => s.setSelectedPoint);
  const setPredictionMode = useAppStore((s) => s.setPredictionMode);

  useEffect(() => {
    fetch(api("/api/v1/heatmap"))
      .then((r) => r.json())
      .then((d) => {
        const pts: Hotspot[] = d.points || [];
        const top3 = [...pts].sort((a, b) => b.risk - a.risk).slice(0, 3);
        setHotspots(top3);
      })
      .catch(() => {});
  }, []);

  if (!hotspots.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className="absolute right-4 top-16 z-30 w-60"
    >
      <div className={`${PANEL} p-3`}>
        <div className="mb-2 flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Highest Risk</p>
        </div>
        <div className="space-y-1.5">
          {hotspots.map((h, i) => (
            <button
              key={`${h.lat}-${h.lon}`}
              onClick={() => {
                setPredictionMode(true);
                setViewState({ latitude: h.lat, longitude: h.lon, zoom: 10 });
                setSelectedPoint({ lat: h.lat, lon: h.lon });
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 group"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-orange-400 transition-colors" />
                  <span className="text-[12px] font-mono text-slate-600 truncate">
                    {h.lat.toFixed(2)}&deg;, {h.lon.toFixed(2)}&deg;
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 ml-[18px]">
                  {riskLabel(h.risk)} risk
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[13px] font-bold tabular-nums" style={{ color: riskColor(h.risk) }}>
                  {h.risk.toFixed(0)}%
                </span>
                <Navigation className="h-3 w-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
