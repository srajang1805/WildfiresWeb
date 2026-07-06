"use client";

import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import Legend from "@/components/panels/Legend";
import LayerControls from "@/components/panels/LayerControls";
import PredictionModal from "@/components/overlays/PredictionModal";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative h-full w-full overflow-hidden">
      <MapView />
      <TopBar />
      <LayerControls />
      <Legend />
      <PredictionModal />
    </main>
  );
}
