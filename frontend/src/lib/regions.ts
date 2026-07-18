export interface Region {
  id: string;
  name: string;
  state: string;
  description: string;
  center: { lat: number; lon: number };
  bounds: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
  area_sq_km: number;
  forest_type: string;
  fire_season: string;
  elevation: string;
  thumbnail: string;
}

export const REGIONS: Region[] = [
  {
    id: "corbett",
    name: "Corbett National Park",
    state: "Uttarakhand",
    description:
      "India's oldest national park, nestled in the Himalayan foothills. Its subtropical forests face increasing fire pressure during the dry pre-monsoon months, driven by high temperatures and human activity in the buffer zone.",
    center: { lat: 29.39, lon: 79.28 },
    bounds: { lat_min: 29.25, lat_max: 29.55, lon_min: 79.05, lon_max: 79.50 },
    area_sq_km: 1318,
    forest_type: "Himalayan Subtropical & Temperate",
    fire_season: "February – May",
    elevation: "300 – 2,400 m",
    thumbnail: "/satellite/corbett.jpg",
  },
  {
    id: "similipal",
    name: "Similipal National Park",
    state: "Odisha",
    description:
      "A vast dry deciduous wilderness in eastern India. Similipal experiences the highest fire frequency among the four monitored regions, with an exceptionally long dry season from October through May.",
    center: { lat: 22.23, lon: 86.41 },
    bounds: { lat_min: 22.00, lat_max: 22.45, lon_min: 86.10, lon_max: 86.70 },
    area_sq_km: 2750,
    forest_type: "Tropical Dry Deciduous",
    fire_season: "January – May",
    elevation: "250 – 1,150 m",
    thumbnail: "/satellite/similipal.jpg",
  },
  {
    id: "jyotikuchi",
    name: "Jyotikuchi Dhopolia Hill",
    state: "Assam",
    description:
      "A small but fire-prone urban-forest interface near Guwahati. Human activity and rapid vegetation drying in the post-monsoon window create sharp fire spikes, making it a valuable testbed for early-warning systems.",
    center: { lat: 26.17, lon: 91.77 },
    bounds: { lat_min: 26.05, lat_max: 26.28, lon_min: 91.65, lon_max: 91.88 },
    area_sq_km: 85,
    forest_type: "Sub-Tropical Deciduous (Urban-Forest Interface)",
    fire_season: "September – April",
    elevation: "100 – 600 m",
    thumbnail: "/satellite/jyotikuchi.jpg",
  },
  {
    id: "laisong",
    name: "Laisong Reserved Forest",
    state: "Assam",
    description:
      "A remote tropical deciduous forest in the Dima Hasao hills. Laisong's fire regime is driven by shifting cultivation cycles and dry winter winds, with active detections peaking in January.",
    center: { lat: 25.85, lon: 92.95 },
    bounds: { lat_min: 25.70, lat_max: 26.00, lon_min: 92.80, lon_max: 93.10 },
    area_sq_km: 450,
    forest_type: "Tropical Deciduous Mixed Forest",
    fire_season: "November – April",
    elevation: "1,200 – 1,800 m",
    thumbnail: "/satellite/laisong.jpg",
  },
];

export function getRegion(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}
