import joblib
import numpy as np
from datetime import datetime
from typing import Optional
from ..config import config
from .feature_engineering import build_feature_array
from ..utils.filters import apply_snowy_region_filter


class WildfirePredictor:
    def __init__(self):
        self._model: Optional[object] = None
        self._model_path = config.models_dir / "wildfire_ensemble.pkl"

    @property
    def model(self):
        if self._model is None:
            try:
                self._model = joblib.load(str(self._model_path))
            except FileNotFoundError:
                raise FileNotFoundError(
                    f"Model not found at {self._model_path}. "
                )
        return self._model

    def predict(self, lat: float, lon: float) -> dict:
        from ..weather.client import weather_client

        weather = weather_client.fetch_current(lat, lon)
        temp = weather["temperature"]
        humidity = weather["humidity"]
        wind = weather["wind"]
        month = datetime.now().month

        features = build_feature_array(lat, lon, temp, humidity, wind, month)
        sample = np.array([features])

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
        from ..weather.client import weather_client

        weather_results = weather_client.fetch_batch(points)
        month = datetime.now().month

        results = []
        for i, (lat, lon) in enumerate(points):
            w = weather_results[i] if i < len(weather_results) else {"temperature": 30, "humidity": 40, "wind": 5}
            temp = w["temperature"]
            humidity = w["humidity"]
            wind_val = w["wind"]

            features = build_feature_array(lat, lon, temp, humidity, wind_val, month)
            sample = np.array([features])

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
        import requests
        from ..weather.client import weather_client

        bounds = config.india_bounds
        lat_min, lat_max = bounds["lat_min"], bounds["lat_max"]
        lon_min, lon_max = bounds["lon_min"], bounds["lon_max"]

        grid = []
        lat = lat_min
        while lat <= lat_max:
            lon = lon_min
            while lon <= lon_max:
                grid.append((round(lat, 4), round(lon, 4)))
                lon += resolution
            lat += resolution

        chunk_size = 300
        chunks = [grid[i:i + chunk_size] for i in range(0, len(grid), chunk_size)]
        month = datetime.now().month

        all_points = []
        default_weather = {"temperature": 30, "humidity": 40, "wind": 5}

        for chunk in chunks:
            try:
                weather_list = weather_client.fetch_batch(chunk)
            except Exception:
                weather_list = [default_weather] * len(chunk)

            feature_rows = []
            chunk_meta = []
            for i, (lat, lon) in enumerate(chunk):
                w = weather_list[i] if i < len(weather_list) else default_weather
                temp = w["temperature"]
                humidity = w["humidity"]
                wind_val = w["wind"]
                features = build_feature_array(lat, lon, temp, humidity, wind_val, month)
                feature_rows.append(features)
                chunk_meta.append((lat, lon, temp))

            arr = np.array(feature_rows, dtype=np.float32)
            probs = self.model.predict_proba(arr)[:, 1]

            for i, (lat, lon, temp) in enumerate(chunk_meta):
                raw_risk = float(probs[i]) * 100
                risk = apply_snowy_region_filter(lat, lon, temp, raw_risk)

                if risk > 0.5:
                    all_points.append({
                        "lat": lat,
                        "lon": lon,
                        "risk": round(risk, 2),
                    })

        return all_points


predictor = WildfirePredictor()
