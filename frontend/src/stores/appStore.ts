import { create } from "zustand";

export interface HeatPoint {
  lat: number;
  lon: number;
  risk: number;
}

interface AppState {
  viewState: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  setViewState: (state: Partial<AppState["viewState"]>) => void;

  predictionMode: boolean;
  setPredictionMode: (mode: boolean) => void;

  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (mode: boolean) => void;

  fireRegionFilter: boolean;
  setFireRegionFilter: (val: boolean) => void;
  forestFilter: boolean;
  setForestFilter: (val: boolean) => void;

  heatmapVisible: boolean;
  setHeatmapVisible: (val: boolean) => void;
  firmsVisible: boolean;
  setFirmsVisible: (val: boolean) => void;
  spreadVisible: boolean;
  setSpreadVisible: (val: boolean) => void;
  windVisible: boolean;
  setWindVisible: (val: boolean) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;

  selectedPoint: { lat: number; lon: number } | null;
  setSelectedPoint: (point: { lat: number; lon: number } | null) => void;

  heatmapData: HeatPoint[];
  setHeatmapData: (data: HeatPoint[]) => void;

  hoverPoint: { lat: number; lon: number; risk: number } | null;
  setHoverPoint: (point: { lat: number; lon: number; risk: number } | null) => void;

  timelineIndex: number;
  setTimelineIndex: (i: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewState: {
    latitude: 22.5,
    longitude: 78.5,
    zoom: 5.5,
  },
  setViewState: (partial) =>
    set((s) => ({ viewState: { ...s.viewState, ...partial } })),

  predictionMode: false,
  setPredictionMode: (mode) => set({ predictionMode: mode }),

  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setDarkMode: (mode) => set({ darkMode: mode }),

  fireRegionFilter: false,
  setFireRegionFilter: (val) => set({ fireRegionFilter: val }),
  forestFilter: false,
  setForestFilter: (val) => set({ forestFilter: val }),

  heatmapVisible: true,
  setHeatmapVisible: (val) => set({ heatmapVisible: val }),
  firmsVisible: false,
  setFirmsVisible: (val) => set({ firmsVisible: val }),
  spreadVisible: false,
  setSpreadVisible: (val) => set({ spreadVisible: val }),
  windVisible: false,
  setWindVisible: (val) => set({ windVisible: val }),

  sidebarOpen: false,
  setSidebarOpen: (val) => set({ sidebarOpen: val }),

  selectedPoint: null,
  setSelectedPoint: (point) => set({ selectedPoint: point }),

  heatmapData: [],
  setHeatmapData: (data) => set({ heatmapData: data }),

  hoverPoint: null,
  setHoverPoint: (point) => set({ hoverPoint: point }),

  timelineIndex: 0,
  setTimelineIndex: (i) => set({ timelineIndex: i }),
}));
