"use client";

import { useAppStore } from "@/stores/appStore";
import { usePrediction } from "@/hooks/usePrediction";
import { PANEL, PANEL_LABEL, PANEL_TEXT, RISK_COLORS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { X, Thermometer, Droplets, Wind } from "lucide-react";

export default function PredictionModal() {
  const selectedPoint = useAppStore((s) => s.selectedPoint);
  const setSelectedPoint = useAppStore((s) => s.setSelectedPoint);
  const predictionMode = useAppStore((s) => s.predictionMode);

  const { data, isLoading } = usePrediction(
    selectedPoint?.lat ?? null,
    selectedPoint?.lon ?? null
  );

  const open = predictionMode && selectedPoint !== null;

  function riskTier(risk: number): keyof typeof RISK_COLORS {
    if (risk < 20) return "low";
    if (risk < 40) return "moderate";
    if (risk < 65) return "high";
    return "extreme";
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setSelectedPoint(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`${PANEL} relative w-72 p-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPoint(null)}
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
            <p className={`${PANEL_LABEL} mb-3`}>Point Analysis</p>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div className={`${PANEL_TEXT} font-mono`}>
                  {selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800">
                    <Thermometer className="mb-1 h-3 w-3 text-zinc-400" />
                    <div className={PANEL_TEXT}>{data.temperature}°C</div>
                  </div>
                  <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800">
                    <Droplets className="mb-1 h-3 w-3 text-zinc-400" />
                    <div className={PANEL_TEXT}>{data.humidity}%</div>
                  </div>
                  <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800">
                    <Wind className="mb-1 h-3 w-3 text-zinc-400" />
                    <div className={PANEL_TEXT}>{data.wind} m/s</div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
                  <span className={PANEL_TEXT}>Fire Risk</span>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: RISK_COLORS[riskTier(data.wildfire_risk)] }}
                  >
                    {data.wildfire_risk.toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
