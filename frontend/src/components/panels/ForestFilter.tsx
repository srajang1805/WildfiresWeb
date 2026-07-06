"use client";

import { motion } from "framer-motion";
import { Trees, MapPin } from "lucide-react";
import { PANEL } from "@/lib/constants";

export interface Reserve {
  id: string;
  name: string;
  state: string;
  bounds: [[number, number], [number, number]];
}

export const FOREST_RESERVES: Reserve[] = [
  { id: "corbett", name: "Jim Corbett", state: "Uttarakhand", bounds: [[29.44, 78.68], [29.65, 79.12]] },
  { id: "kanha", name: "Kanha Tiger Reserve", state: "Madhya Pradesh", bounds: [[22.24, 80.42], [22.41, 80.74]] },
  { id: "periyar", name: "Periyar Tiger Reserve", state: "Kerala", bounds: [[9.44, 77.00], [9.64, 77.33]] },
  { id: "similipal", name: "Similipal Biosphere", state: "Odisha", bounds: [[21.68, 86.05], [21.88, 86.45]] },
  { id: "kaziranga", name: "Kaziranga", state: "Assam", bounds: [[26.56, 93.02], [26.73, 93.38]] },
];

interface Props {
  active: string;
  onChange: (reserve: Reserve) => void;
}

export default function ForestFilter({ active, onChange }: Props) {
  const selected = FOREST_RESERVES.find((r) => r.id === active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="absolute left-4 top-24 z-30"
    >
      <div className={`${PANEL} w-64 p-4`}>
        <div className="mb-3 flex items-center gap-2">
          <Trees className="h-3.5 w-3.5 text-emerald-600" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Protected Reserves
          </p>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => onChange({ id: "all", name: "All India", state: "", bounds: [[6.5, 67.0], [38.0, 98.0]] })}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-200 ${
              !selected
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-blue-50"
            }`}
          >
            <span className="text-[13px] font-medium flex-1">All India</span>
          </button>

          {FOREST_RESERVES.map((r) => (
            <button
              key={r.id}
              onClick={() => onChange(r)}
              className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-200 ${
                active === r.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              <span className="text-[13px] font-medium flex-1">{r.name}</span>
              <span className={`text-[10px] ${active === r.id ? "text-blue-100" : "text-slate-400"}`}>{r.state}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="h-3 w-3 text-emerald-600" />
              <span className="text-[12px] font-semibold text-slate-800">{selected.name}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">{selected.state}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
