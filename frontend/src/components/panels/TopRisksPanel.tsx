"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Flame, MapPin } from "lucide-react";
import { PANEL, RISK_COLORS, api } from "@/lib/constants";

interface Hotspot { lat: number; lon: number; risk: number }
type Ring = [number, number][];

function pointInPolygon(px: number, py: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function isInsideIndia(lat: number, lon: number, rings: Ring[]): boolean {
  return rings.some((ring) => pointInPolygon(lon, lat, ring));
}

function riskColor(r: number): string {
  if (r < 20) return RISK_COLORS.low;
  if (r < 40) return RISK_COLORS.moderate;
  if (r < 65) return RISK_COLORS.high;
  if (r < 85) return RISK_COLORS.veryHigh;
  return RISK_COLORS.extreme;
}

export default function TopRisksPanel() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const setViewState = useAppStore((s) => s.setViewState);
  const setSelectedPoint = useAppStore((s) => s.setSelectedPoint);

  useEffect(() => {
    Promise.all([
      fetch(api("/api/v1/heatmap")).then((r) => r.json()),
      fetch("/india.geojson").then((r) => r.json()),
    ]).then(([hd, gj]) => {
      const pts: Hotspot[] = hd.points || [];
      const feats = (gj as { features: Array<{ geometry: { type: string; coordinates: unknown } }> }).features;
      const rings: Ring[] = [];
      for (const f of feats) {
        const g = f.geometry;
        const polys = g.type === "Polygon" ? [g.coordinates as number[][][]] : g.type === "MultiPolygon" ? (g.coordinates as number[][][][]) : [];
        for (const poly of polys) for (const r of poly) rings.push(r as Ring);
      }
      const inside = pts.filter((p) => isInsideIndia(p.lat, p.lon, rings));
      setHotspots([...inside].sort((a, b) => b.risk - a.risk).slice(0, 3));
    }).catch(() => {});
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
              key={i}
              onClick={() => {
                setViewState({ latitude: h.lat, longitude: h.lon, zoom: 10 });
                setSelectedPoint({ lat: h.lat, lon: h.lon });
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  <span className="text-[11px] font-mono text-slate-600 truncate">{h.lat.toFixed(2)}&deg;, {h.lon.toFixed(2)}&deg;</span>
                </div>
              </div>
              <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: riskColor(h.risk) }}>{h.risk.toFixed(0)}%</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
