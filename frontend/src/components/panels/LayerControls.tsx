"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { PANEL } from "@/lib/constants";
import { Layers } from "lucide-react";

export default function LayerControls() {
  const firmsVisible = useAppStore((s) => s.firmsVisible);
  const setFirmsVisible = useAppStore((s) => s.setFirmsVisible);

  const rows = [
    { label: "Active Fires", value: firmsVisible, toggle: () => setFirmsVisible(!firmsVisible) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="absolute bottom-24 left-4 z-30"
    >
      <div className={`${PANEL} p-4`}>
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Layers</p>
        </div>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <button
              key={row.label}
              onClick={row.toggle}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
            >
              <span className="text-[13px] font-medium text-slate-700">{row.label}</span>
              <span className={`relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full transition-colors ${row.value ? "bg-blue-600" : "bg-slate-200"}`}>
                <span className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform ${row.value ? "translate-x-[17px]" : "translate-x-[2px]"}`} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
