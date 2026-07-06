"use client";

import { motion } from "framer-motion";
import { PANEL, PANEL_LABEL, PANEL_TEXT } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";

interface ToggleRow {
  key: string;
  label: string;
  value: boolean;
  onChange: () => void;
}

export default function LayerControls() {
  const heatmapVisible = useAppStore((s) => s.heatmapVisible);
  const setHeatmapVisible = useAppStore((s) => s.setHeatmapVisible);
  const firmsVisible = useAppStore((s) => s.firmsVisible);
  const setFirmsVisible = useAppStore((s) => s.setFirmsVisible);
  const spreadVisible = useAppStore((s) => s.spreadVisible);
  const setSpreadVisible = useAppStore((s) => s.setSpreadVisible);
  const windVisible = useAppStore((s) => s.windVisible);
  const setWindVisible = useAppStore((s) => s.setWindVisible);

  const rows: ToggleRow[] = [
    { key: "heatmap", label: "Fire Risk", value: heatmapVisible, onChange: () => setHeatmapVisible(!heatmapVisible) },
    { key: "firms", label: "Active Fires", value: firmsVisible, onChange: () => setFirmsVisible(!firmsVisible) },
    { key: "spread", label: "Spread Sim", value: spreadVisible, onChange: () => setSpreadVisible(!spreadVisible) },
    { key: "wind", label: "Wind Field", value: windVisible, onChange: () => setWindVisible(!windVisible) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.2 }}
      className="absolute bottom-6 left-4 z-30"
    >
      <div className={`${PANEL} p-3 min-w-[140px]`}>
        <p className={`${PANEL_LABEL} mb-2`}>Layers</p>
        <div className="space-y-1">
          {rows.map((row) => (
            <button
              key={row.key}
              onClick={row.onChange}
              className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${row.value ? "" : "opacity-50"}`}
            >
              <span className={PANEL_TEXT}>{row.label}</span>
              <span
                className={`h-3.5 w-3.5 shrink-0 rounded-[2px] border transition-colors ${
                  row.value
                    ? "border-orange-500 bg-orange-500"
                    : "border-zinc-300 bg-transparent dark:border-zinc-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
