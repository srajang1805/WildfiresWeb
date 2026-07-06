"use client";

import { motion } from "framer-motion";
import { RISK_TIERS, RISK_COLORS } from "@/lib/constants";
import { PANEL } from "@/lib/constants";

export default function Legend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="absolute bottom-24 right-4 z-30 w-48"
    >
      <div className={`${PANEL} p-4`}>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Risk Index
        </p>
        <div className="space-y-2">
          {RISK_TIERS.map((t) => (
            <div key={t.key} className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: RISK_COLORS[t.key] }}
              />
              <span className="flex-1 text-[13px] font-medium text-slate-700">{t.label}</span>
              <span className="text-[12px] tabular-nums text-slate-400">{t.range}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
