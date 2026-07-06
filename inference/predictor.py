import joblib
import numpy as np
from datetime import datetime
from typing import Optional
from ..config import config
from ..utils.features import month_features
from ..utils.filters import apply_snowy_region_filter
from ..weather.client import weather_client


class WildfirePredictor:
    def __init__(self):
        self._model: Optional[object] = None
        self._model_path = config.default_model_path

    @property
    def model(self):
        if self._model is None:
            try:
                self._model = joblib.load(self._model_path)
            except FileNotFoundError:
                raise FileNotFoundError(
                    f"Model not found at {self._model_path}. "
                    f"Train or place a model file at this path."
                )
        return self._model

    def predict(self, lat: float, lon: float) -> dict:
        weather = weather_client.fetch_current(lat, lon)
        temp = weather["temperature"]
        humidity = weather["humidity"]
        wind = weather["wind"]

        month = datetime.now().month
        month_sin, month_cos = month_features(month)

        sample = np.array([[lat, lon, month_sin, month_cos, temp, humidity, wind, 2]])

        prob = self.model.predict_proba(sample)[0][1]
        raw_risk = prob * 100

        risk = apply_snowy_region_filter(lat, lon, temp, raw_risk)

        return {
            "wildfire_risk": round(risk, 2),
            "temperature": temp,
            "humidity": humidity,
            "wind": wind,
        }

    def predict_batch(self, points: list[tuple[float, float]]) -> list[dict]:
        weather_results = weather_client.fetch_batch(points)

        month = datetime.now().month
        month_sin, month_cos = month_features(month)

        results = []
        for i, (lat, lon) in enumerate(points):
            w = weather_results[i] if i < len(weather_results) else {"temperature": 30, "humidity": 40, "wind": 5}
            temp = w["temperature"]
            humidity = w["humidity"]
            wind_val = w["wind"]

            sample = np.array([[lat, lon, month_sin, month_cos, temp, humidity, wind_val, 2]])

            prob = self.model.predict_proba(sample)[0][1]
            raw_risk = prob * 100

            risk = apply_snowy_region_filter(lat, lon, temp, raw_risk)

            results.append({
                "lat": lat,
                "lon": lon,
                "risk": round(risk, 2),
            })

        return results

    def predict_heatmap(self, resolution: float = 0.5) -> list[dict]:
        from shapely.geometry import Point
        import json

        bounds = config.india_bounds
        lat_min, lat_max = bounds["lat_min"], bounds["lat_max"]
        lon_min, lon_max = bounds["lon_min"], bounds["lon_max"]

        grid = set()
        lat = lat_min
        while lat <= lat_max:
            lon = lon_min
            while lon <= lon_max:
                grid.add((round(lat, 4), round(lon, 4)))
                lon += resolution
            lat += resolution

        grid_list = list(grid)
        chunk_size = 30
        chunks = [grid_list[i:i + chunk_size] for i in range(0, len(grid_list), chunk_size)]

        from concurrent.futures import ThreadPoolExecutor
        all_points = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(self.predict_batch, chunk) for chunk in chunks]
            for future in futures:
                all_points.extend(future.result())

        return all_points


predictor = WildfirePredictor()
