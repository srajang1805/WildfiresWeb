"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Flame, MapPin } from "lucide-react";
import { PANEL, RISK_COLORS, api } from "@/lib/constants";

interface Hotspot { lat: number; lon: number; risk: number; name: string }

const HOTSPOTS = [
  { lat: 22.23, lon: 86.41, name: "Similipal" },
  { lat: 29.39, lon: 79.28, name: "Corbett" },
  { lat: 26.17, lon: 91.77, name: "Jyotikuchi" },
  { lat: 25.85, lon: 92.95, name: "Laisong" },
  { lat: 19.08, lon: 72.88, name: "Mumbai" },
  { lat: 12.97, lon: 77.59, name: "Bengaluru" },
];

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
    Promise.all(
      HOTSPOTS.map((h) =>
        fetch(api(`/api/v1/predict?lat=${h.lat}&lon=${h.lon}`))
          .then((r) => r.json())
          .then((d) => ({ ...h, risk: d.wildfire_risk || 0 }))
          .catch(() => ({ ...h, risk: 0 }))
      )
    ).then((results) => {
      const sorted = results.sort((a, b) => b.risk - a.risk).slice(0, 3);
      setHotspots(sorted);
    });
  }, []);

  if (!hotspots.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className="absolute right-4 top-16 z-30 w-56"
    >
      <div className={`${PANEL} p-3`}>
        <div className="mb-2 flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Highest Risk</p>
        </div>
        <div className="space-y-1.5">
          {hotspots.map((h, i) => (
            <button
              key={h.name}
              onClick={() => {
                setPredictionMode(true);
                setViewState({ latitude: h.lat, longitude: h.lon, zoom: 10 });
                setSelectedPoint({ lat: h.lat, lon: h.lon });
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  <span className="text-[12px] font-medium text-slate-700 truncate">{h.name}</span>
                </div>
              </div>
              <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: riskColor(h.risk) }}>
                {h.risk.toFixed(0)}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
