"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/stores/appStore";
import { INDIA_CENTER } from "@/lib/constants";
import ActiveFireLayer from "@/components/map/ActiveFireLayer";
import RegionOverlay from "@/components/map/RegionOverlay";
import AlertMarkerLayer from "@/components/map/AlertMarkerLayer";

export default function MapView() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const firmsVisible = useAppStore((s) => s.firmsVisible);
  const forestRange = useAppStore((s) => s.activeReserve);
  const getForestBounds = useAppStore((s) => s.getReserveBounds);
  const selectedPoint = useAppStore((s) => s.selectedPoint);
  const setViewState = useAppStore((s) => s.setViewState);
  const setSelectedPoint = useAppStore((s) => s.setSelectedPoint);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = L.map(container.current, {
      center: [INDIA_CENTER[1], INDIA_CENTER[0]],
      zoom: 5.8,
      minZoom: 5, maxZoom: 18,
      zoomControl: true, attributionControl: false,
      maxBounds: L.latLngBounds([2.0, 62.0], [41.0, 102.0]),
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap", maxZoom: 19,
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

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || forestRange === "all") return;
    const bounds = getForestBounds(forestRange);
    const lb = L.latLngBounds([bounds[0][0], bounds[0][1]], [bounds[1][0], bounds[1][1]]);
    mapRef.current.flyToBounds(lb, { padding: [60, 60], duration: 1.0, maxZoom: 14 });
  }, [forestRange, getForestBounds]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (markerRef.current) { mapRef.current.removeLayer(markerRef.current); markerRef.current = null; }
    if (!selectedPoint) return;
    markerRef.current = L.circleMarker([selectedPoint.lat, selectedPoint.lon], {
      radius: 8, color: "#F97316", fillColor: "#F97316", fillOpacity: 0.5, weight: 2.5,
    }).addTo(mapRef.current);
  }, [selectedPoint]);

  return (
    <>
      <div ref={container} className="absolute inset-0 z-0 bg-slate-100" />
      <ActiveFireLayer map={mapRef.current} visible={firmsVisible} />
      <RegionOverlay map={mapRef.current} reserve={forestRange} />
      <AlertMarkerLayer map={mapRef.current} visible={true} />
    </>
  );
}
