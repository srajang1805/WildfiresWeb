"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { RegionAnalysisResponse } from "@/lib/regionTypes";

const IMPACT_COLORS = {
  high: "bg-red-50 text-red-700 border-red-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function FeatureImportance({ items }: { items: RegionAnalysisResponse["feature_importance"] }) {
  if (!items?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Feature Drivers</p>
      {items.map((fi, i) => (
        <motion.div
          key={fi.feature}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.25 }}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${IMPACT_COLORS[fi.impact]}`}
        >
          {fi.direction === "up" ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
          ) : fi.direction === "down" ? (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Minus className="h-3.5 w-3.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold">{fi.feature}</p>
            <p className="text-[10px] opacity-70 truncate">{fi.explanation}</p>
          </div>
          <span className="text-[10px] font-bold uppercase shrink-0">{fi.impact}</span>
        </motion.div>
      ))}
    </div>
  );
}
