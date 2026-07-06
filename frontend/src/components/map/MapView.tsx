"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/stores/appStore";
import { INDIA_CENTER } from "@/lib/constants";

const IMG_URL = "http://localhost:8001/api/v1/heatmap-image.png";
const IMG_BOUNDS: L.LatLngBoundsExpression = [[3.0, 64.0], [39.0, 100.0]];

export default function MapView() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const [loading, setLoading] = useState(true);

  const heatmapVisible = useAppStore((s) => s.heatmapVisible);
  const setViewState = useAppStore((s) => s.setViewState);
  const setSelectedPoint = useAppStore((s) => s.setSelectedPoint);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = L.map(container.current, {
      center: [INDIA_CENTER[1], INDIA_CENTER[0]],
      zoom: 5.8,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
      maxBounds: L.latLngBounds(IMG_BOUNDS as L.LatLngBoundsLiteral),
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    map.on("moveend", () => {
      const c = map.getCenter();
      setViewState({ latitude: c.lat, longitude: c.lng, zoom: map.getZoom() });
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (useAppStore.getState().predictionMode) {
        setSelectedPoint({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    });

    const overlay = L.imageOverlay(IMG_URL, IMG_BOUNDS, {
      opacity: 0.7,
      zIndex: 400,
    });

    overlay.on("load", () => {
      overlayRef.current = overlay;
      setLoading(false);
    });
    overlay.on("error", () => setLoading(false));

    overlay.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setOpacity(heatmapVisible ? 0.7 : 0);
    }
  }, [heatmapVisible]);

  return (
    <>
      <div ref={container} className="absolute inset-0 z-0 bg-zinc-200 dark:bg-zinc-800" />
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-900/90 px-6 py-4 shadow-2xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-xs font-medium text-zinc-300">Loading wildfire data...</p>
          </div>
        </div>
      )}
    </>
  );
}
