"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

import { api } from "@/lib/constants";

const FIRMS_URL = api("/api/v1/firms");
const GEOJSON_URL = "/india.geojson";

type Ring = [number, number][];

function pointInPolygon(px: number, py: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function isInsideIndia(lat: number, lon: number, rings: Ring[]): boolean {
  return rings.some((ring) => pointInPolygon(lon, lat, ring));
}

function extractRings(gj: Record<string, unknown>): Ring[] {
  const out: Ring[] = [];
  const feats = (gj as { features: Array<{ geometry: { type: string; coordinates: unknown } }> }).features;
  for (const f of feats) {
    const g = f.geometry;
    const polys = g.type === "Polygon" ? [g.coordinates as number[][][]] : g.type === "MultiPolygon" ? (g.coordinates as number[][][][]) : [];
    for (const poly of polys) for (const r of poly) out.push(r as Ring);
  }
  return out;
}

function fireColor(conf: string) { return conf === "h" ? "#DC2626" : conf === "n" ? "#F97316" : "#F59E0B"; }
function fireRadius(conf: string, frp: number) {
  let r = conf === "h" ? 5 : conf === "n" ? 4 : 3;
  if (frp > 10) r += 1;
  if (frp > 50) r += 2;
  return r;
}

interface Props { map: L.Map | null; visible: boolean }

export default function ActiveFireLayer({ map, visible }: Props) {
  const layerRef = useRef<L.LayerGroup>(L.layerGroup());
  const ringsRef = useRef<Ring[]>([]);
  const [count, setCount] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    if (!map) return;
    if (visible && !map.hasLayer(layerRef.current)) layerRef.current.addTo(map);
    if (!visible) map.removeLayer(layerRef.current);
  }, [map, visible]);

  useEffect(() => {
    if (!map || loaded.current) return;
    loaded.current = true;

    Promise.all([
      fetch(FIRMS_URL).then((r) => r.json()),
      fetch(GEOJSON_URL).then((r) => r.json()),
    ]).then(([fd, gj]) => {
      ringsRef.current = extractRings(gj as Record<string, unknown>);
      const fires = (fd.detections || []) as Array<{ lat: number; lon: number; brightness: number; frp: number; date: string; confidence: string }>;
      let inside = 0;

      fires.forEach((d) => {
        if (!isInsideIndia(d.lat, d.lon, ringsRef.current)) return;
        inside++;
        const color = fireColor(d.confidence);

        L.circleMarker([d.lat, d.lon], {
          radius: fireRadius(d.confidence, d.frp),
          color,
          fillColor: color,
          fillOpacity: 0.55,
          weight: 1.5,
        }).bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.6;color:#334155">` +
          `<div style="font-weight:700;color:#DC2626;margin-bottom:4px">Active Fire</div>` +
          `Lat: ${d.lat.toFixed(4)} &middot; Lon: ${d.lon.toFixed(4)}<br>` +
          `Brightness: <b>${d.brightness}K</b><br>` +
          `FRP: <b>${d.frp} MW</b><br>` +
          `Confidence: <b>${d.confidence.toUpperCase()}</b><br>` +
          `Date: ${d.date}</div>`
        ).addTo(layerRef.current);
      });

      setCount(inside);
    });
  }, [map]);

  return null;
}
