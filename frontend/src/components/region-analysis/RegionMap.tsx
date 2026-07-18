"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRegionAnalysis } from "@/hooks/useRegionAnalysis";

interface Props {
  regionId: string;
  center: [number, number];
  bounds: L.LatLngBoundsExpression;
}

export default function RegionMap({ regionId, center, bounds }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoLayer = useRef<L.GeoJSON | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!container.current || initialized.current) return;
    initialized.current = true;

    const map = L.map(container.current, {
      center,
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
    }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
      opacity: 0.35,
    }).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });

    markerRef.current = L.circleMarker(center, {
      radius: 10,
      color: "#F97316",
      fillColor: "#F97316",
      fillOpacity: 0.35,
      weight: 3,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      initialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    fetch("/forestReserves.geojson")
      .then((r) => r.json())
      .then((data) => {
        if (geoLayer.current) mapRef.current?.removeLayer(geoLayer.current);
        const layer = L.geoJSON(data as never, {
          filter: (feature) => {
            if (!feature || !("properties" in feature)) return false;
            const props = feature.properties as Record<string, string>;
            return props.id === regionId;
          },
          style: () => ({
            color: "#16A34A",
            weight: 3,
            fillColor: "#22C55E",
            fillOpacity: 0.18,
            dashArray: "6 3",
          }),
        });
        layer.addTo(mapRef.current!);
        geoLayer.current = layer;
      });
  }, [regionId]);

  return <div ref={container} className="h-full w-full rounded-2xl" />;
}
