export interface RegionAnalysisResponse {
  region: string;
  region_name: string;
  state: string;
  area_sq_km: number;
  coordinates: { lat: number; lon: number };
  risk: {
    label: "Low" | "Moderate" | "High" | "Very High" | "Extreme";
    probability: number;
    confidence: number;
  };
  model: {
    name: string;
    type: string;
    features: string[];
    feature_count: number;
  };
  weather: {
    temperature: number;
    humidity: number;
    wind: number;
    vpd: number;
    svp: number;
  };
  feature_importance: Array<{
    feature: string;
    direction: "up" | "down" | "neutral";
    impact: "low" | "moderate" | "high";
    explanation: string;
  }>;
  explanation: string;
  last_updated: string;
}

export interface RegionData extends RegionAnalysisResponse {
  satellite_date?: string;
  last_weather_update?: string;
}
