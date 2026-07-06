"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface Props { map: L.Map | null; reserve: string }

export default function RegionOverlay({ map, reserve }: Props) {
  const geoLayer = useRef<L.GeoJSON | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!map || loaded.current) return;
    loaded.current = true;

    fetch("/forestReserves.geojson")
      .then((r) => r.json())
      .then((data) => {
        const layer = L.geoJSON(data as never, {
          style: () => ({
            color: "#16A34A",
            weight: 0,
            fillColor: "#22C55E",
            fillOpacity: 0,
            interactive: false,
          }),
        });
        geoLayer.current = layer;
      });
  }, [map]);

  useEffect(() => {
    if (!geoLayer.current || !map) return;

    map.removeLayer(geoLayer.current);

    if (reserve === "all") return;

    geoLayer.current.eachLayer((l) => {
      const feature = (l as L.GeoJSON).feature;
      if (!feature || !("properties" in feature)) return;
      const props = feature.properties as Record<string, string>;
      const id = props.id;

      if (id === reserve) {
        (l as L.Path).setStyle({
          color: "#16A34A",
          weight: 3,
          fillColor: "#22C55E",
          fillOpacity: 0.2,
        });
        l.bindTooltip(props.name || "", { sticky: true });
        l.on("mouseover", function (this: L.Path) {
          this.setStyle({ weight: 4, fillOpacity: 0.28 });
        });
        l.on("mouseout", function (this: L.Path) {
          this.setStyle({ weight: 3, fillOpacity: 0.2 });
        });
      } else {
        (l as L.Path).setStyle({
          color: "#16A34A",
          weight: 0,
          fillColor: "#22C55E",
          fillOpacity: 0,
        });
      }
    });

    geoLayer.current.addTo(map);
  }, [reserve, map]);

  return null;
}
