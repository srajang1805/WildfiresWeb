"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export default function PredictionExplanation({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 ring-1 ring-blue-100"
    >
      <div className="flex items-start gap-2.5">
        <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 mb-1">Analysis</p>
          <p className="text-[12px] leading-relaxed text-slate-600">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}
