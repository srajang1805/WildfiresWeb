"use client";

import { motion } from "framer-motion";
import { PANEL, PANEL_TEXT } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";
import { Flame, Sun, Moon } from "lucide-react";

export default function TopBar() {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const predictionMode = useAppStore((s) => s.predictionMode);
  const setPredictionMode = useAppStore((s) => s.setPredictionMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute left-4 right-4 top-4 z-30 flex items-center justify-end gap-2"
    >
      <button
        onClick={() => setPredictionMode(!predictionMode)}
        className={`${PANEL} flex items-center gap-1.5 px-3 py-2 transition-colors hover:bg-white/90 dark:hover:bg-zinc-800/90 ${
          predictionMode ? "text-orange-500" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        <Flame className="h-3.5 w-3.5" />
        <span className={PANEL_TEXT}>Predict</span>
      </button>

      <button
        onClick={toggleDarkMode}
        className={`${PANEL} p-2 transition-colors hover:bg-white/90 dark:hover:bg-zinc-800/90`}
      >
        {darkMode ? (
          <Sun className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
        )}
      </button>
    </motion.div>
  );
}
