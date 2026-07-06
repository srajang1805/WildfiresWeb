"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Flame } from "lucide-react";

export default function TopBar() {
  const predictionMode = useAppStore((s) => s.predictionMode);
  const setPredictionMode = useAppStore((s) => s.setPredictionMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 top-4 z-30"
    >
      <button
        onClick={() => setPredictionMode(!predictionMode)}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all shadow-lg ${
          predictionMode
            ? "bg-blue-600 text-white shadow-blue-200 ring-1 ring-blue-500"
            : "bg-white text-slate-600 shadow-slate-200/50 ring-1 ring-slate-200/80 hover:bg-slate-50"
        }`}
      >
        <Flame className="h-4 w-4" />
        Predict {predictionMode ? "ON" : "Mode"}
      </button>
    </motion.div>
  );
}
