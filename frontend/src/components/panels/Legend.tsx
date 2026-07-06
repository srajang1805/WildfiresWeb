"use client";

import { motion } from "framer-motion";
import { PANEL, PANEL_LABEL, PANEL_TEXT, PANEL_MUTED, RISK_TIERS, RISK_COLORS } from "@/lib/constants";

export default function Legend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.2 }}
      className="absolute bottom-6 right-4 z-30 w-40"
    >
      <div className={`${PANEL} p-3`}>
        <p className={`${PANEL_LABEL} mb-2`}>Risk Index</p>
        <div className="space-y-1.5">
          {RISK_TIERS.map((tier) => (
            <div key={tier.key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: RISK_COLORS[tier.key] }}
              />
              <span className={`${PANEL_TEXT} flex-1`}>{tier.label}</span>
              <span className={PANEL_MUTED}>{tier.range}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
