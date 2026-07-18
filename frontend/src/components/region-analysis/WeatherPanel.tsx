"use client";

import { motion } from "framer-motion";
import { Thermometer, Droplets, Wind, Gauge, Waves } from "lucide-react";

interface Weather {
  temperature: number;
  humidity: number;
  wind: number;
  vpd: number;
  svp: number;
}

const cards = [
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, color: "text-orange-500", bg: "bg-orange-50" },
  { key: "humidity", label: "Humidity", unit: "%", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
  { key: "wind", label: "Wind Speed", unit: "m/s", icon: Wind, color: "text-cyan-500", bg: "bg-cyan-50" },
  { key: "vpd", label: "VPD", unit: "kPa", icon: Gauge, color: "text-rose-500", bg: "bg-rose-50" },
  { key: "svp", label: "SVP", unit: "kPa", icon: Waves, color: "text-indigo-500", bg: "bg-indigo-50" },
];

export default function WeatherPanel({ weather }: { weather: Weather }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Weather Conditions</p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className={`rounded-xl ${c.bg} p-3`}
          >
            <c.icon className={`h-3.5 w-3.5 ${c.color} mb-1`} />
            <p className="text-[10px] font-medium text-slate-500">{c.label}</p>
            <p className="text-[15px] font-bold tabular-nums text-slate-800">
              {(weather[c.key as keyof Weather] ?? 0).toFixed(1)}
              <span className="text-[10px] font-normal text-slate-400 ml-0.5">{c.unit}</span>
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
