"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAlerts } from "@/hooks/useAlerts";

interface Props {
  map: L.Map | null;
  visible: boolean;
}

export default function AlertMarkerLayer({ map, visible }: Props) {
  const { data: alerts } = useAlerts();
  const layerRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    if (!map) return;
    if (visible && !map.hasLayer(layerRef.current)) {
      layerRef.current.addTo(map);
    }
    if (!visible) {
      map.removeLayer(layerRef.current);
    }
  }, [map, visible]);

  useEffect(() => {
    if (!alerts || alerts.length === 0) {
      layerRef.current.clearLayers();
      return;
    }

    layerRef.current.clearLayers();

    alerts.forEach((a) => {
      const el = document.createElement("div");
      el.className = "flex items-center justify-center";
      el.innerHTML = `<div style="width:14px;height:14px;border-radius:50%;background:#DC2626;border:2px solid white;box-shadow:0 0 6px rgba(220,38,38,0.5);animation:pulse-fire 2s infinite"></div>`;

      const icon = L.divIcon({
        html: el.outerHTML,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([a.lat, a.lon], { icon, zIndexOffset: 1000 });
      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.5;color:#334155">
          <b style="color:#DC2626">${a.zone_name}</b><br/>
          FRP: ${a.frp.toFixed(1)} MW &middot; ${a.confidence.toUpperCase()}
        </div>`,
        { direction: "top", offset: [0, -8] }
      );
      marker.addTo(layerRef.current);
    });
  }, [alerts]);

  return null;
}
