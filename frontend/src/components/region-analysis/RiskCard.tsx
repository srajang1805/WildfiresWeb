"use client";

import { motion } from "framer-motion";
import { Shield, TrendingUp } from "lucide-react";

const RISK_CONFIG = {
  Low: { color: "#16A34A", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  Moderate: { color: "#F59E0B", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  High: { color: "#F97316", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  "Very High": { color: "#DC2626", bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
  Extreme: { color: "#7C3AED", bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200" },
} as const;

interface Props {
  label: string;
  probability: number;
  confidence: number;
}

export default function RiskCard({ label, probability, confidence }: Props) {
  const cfg = RISK_CONFIG[label as keyof typeof RISK_CONFIG] || RISK_CONFIG.Low;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl ${cfg.bg} ${cfg.ring} ring-1 p-5`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4" style={{ color: cfg.color }} />
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Fire Risk</p>
      </div>

      <div className="flex items-end justify-between mb-4">
        <span className={`text-[40px] font-black leading-none tabular-nums ${cfg.text}`}>
          {probability.toFixed(1)}%
        </span>
        <span
          className="rounded-full px-3 py-1 text-[12px] font-bold text-white"
          style={{ background: cfg.color }}
        >
          {label.toUpperCase()}
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-white/60 overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, probability)}%` }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: cfg.color }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-slate-500">Confidence</span>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-slate-400" />
          <span className="text-[12px] font-bold tabular-nums text-slate-700">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
