"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Flame, MapPin, Shield, X, ChevronUp } from "lucide-react";
import { useAlerts, useAlertSummary, type Alert } from "@/hooks/useAlerts";
import { useAppStore } from "@/stores/appStore";
import { PANEL } from "@/lib/constants";

function alertKey(a: Alert) { return a.key; }
function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ""; }
}
function confColor(c: string) { return c === "h" ? "text-red-600" : c === "n" ? "text-orange-500" : "text-amber-400"; }
function confBg(c: string) { return c === "h" ? "bg-red-50 ring-red-200" : c === "n" ? "bg-orange-50 ring-orange-200" : "bg-amber-50 ring-amber-200"; }

export default function AlertPanel() {
  const { data: alerts, isLoading } = useAlerts();
  const { data: summary } = useAlertSummary();
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const prevCount = useState(0)[0];
  const setViewState = useAppStore((s) => s.setViewState);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setHasNew(true);
      const t = setTimeout(() => setHasNew(false), 3000);
      return () => clearTimeout(t);
    }
  }, [alerts?.length]);

  const flyTo = useCallback((a: Alert) => {
    setViewState({ latitude: a.lat, longitude: a.lon, zoom: 13 });
    setOpen(false);
  }, [setViewState]);

  const activeZones = summary?.filter((z) => z.status !== "safe") || [];
  const hasActiveAlerts = (alerts?.length || 0) > 0;

  return (
    <>
      {/* Toggle button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setOpen(!open)}
        className={`absolute left-4 z-30 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold shadow-lg transition-all hover:scale-105 ${
          hasActiveAlerts
            ? "bg-red-600 text-white shadow-red-200"
            : "bg-white text-slate-600 shadow-slate-200/50 ring-1 ring-slate-200/80"
        }`}
        style={{ top: open ? "360px" : "84px" }}
      >
        {hasActiveAlerts ? <BellRing className="h-4 w-4 animate-pulse" /> : <Bell className="h-4 w-4" />}
        Geo-Fence
        {hasActiveAlerts && (
          <span className="rounded-full bg-white/25 px-1.5 py-0 text-[10px] font-bold text-white">
            {alerts?.length || activeZones.length}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute left-4 z-30 w-72 overflow-hidden ${PANEL}`}
            style={{ top: "124px", maxHeight: "calc(100vh - 200px)" }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <div className="flex items-center gap-2">
                {hasActiveAlerts ? (
                  <BellRing className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Bell className="h-3.5 w-3.5 text-slate-400" />
                )}
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Alert Zones</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto">
              {/* Zone status summary */}
              {summary && summary.length > 0 && (
                <div className="px-3 py-2 border-b border-slate-50">
                  <div className="space-y-1">
                    {summary.map((z) => (
                      <div key={z.zone_id} className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-600 truncate flex-1">{z.zone_name}</span>
                        {z.alert_count > 0 && (
                          <span className="tabular-nums text-slate-400 mr-2">{z.alert_count}</span>
                        )}
                        <span className={`rounded-full px-1.5 py-0 text-[9px] font-bold uppercase ${
                          z.status === "active" ? "bg-red-100 text-red-700" :
                          z.status === "watch" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {z.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active alerts list */}
              {isLoading && (
                <div className="px-3 py-6 text-center text-[12px] text-slate-400">Loading alerts...</div>
              )}

              {alerts && alerts.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Shield className="h-6 w-6 text-emerald-400 mb-2" />
                  <p className="text-[12px] font-medium text-slate-500">All zones clear</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">No active fire detections inside reserves</p>
                </div>
              )}

              {alerts && alerts.map((a) => (
                <motion.button
                  key={alertKey(a)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => flyTo(a)}
                  className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${confBg(a.confidence)}`}
                >
                  <Flame className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${confColor(a.confidence)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-700 truncate">{a.zone_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 truncate">
                        {a.lat.toFixed(2)}°, {a.lon.toFixed(2)}°
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] tabular-nums text-slate-500">
                        FRP {a.frp.toFixed(1)} MW
                      </span>
                      <span className={`text-[9px] font-bold uppercase ${confColor(a.confidence)}`}>
                        {a.confidence === "h" ? "High conf" : a.confidence === "n" ? "Nominal" : "Low"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0">{timeAgo(a.detected_at)}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
