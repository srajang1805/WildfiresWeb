import requests
import time
import logging
from typing import Optional
from ..config import config

logger = logging.getLogger(__name__)


class OpenMeteoClient:
    def __init__(self):
        self.base_url = config.open_meteo_base_url
        self.timeout = 10
        self.max_retries = 2

    def _call_with_retry(self, params: dict, timeout: int) -> requests.Response | None:
        headers = {"User-Agent": "WildfireEngine/1.0"}
        for attempt in range(self.max_retries + 1):
            try:
                r = requests.get(self.base_url, params=params, headers=headers, timeout=timeout)
                if r.status_code == 200:
                    return r
                logger.warning(
                    f"Open-Meteo returned {r.status_code} "
                    f"(attempt {attempt + 1}/{self.max_retries + 1}): {r.text[:150]}"
                )
                time.sleep(1.0 * (attempt + 1))
            except requests.exceptions.Timeout:
                logger.warning(
                    f"Open-Meteo timeout (attempt {attempt + 1}/{self.max_retries + 1})"
                )
                time.sleep(1.0 * (attempt + 1))
            except requests.exceptions.ConnectionError as e:
                logger.warning(
                    f"Open-Meteo connection error (attempt {attempt + 1}/{self.max_retries + 1}): {e}"
                )
                time.sleep(1.0 * (attempt + 1))
            except Exception as e:
                logger.warning(
                    f"Open-Meteo error (attempt {attempt + 1}/{self.max_retries + 1}): {e}"
                )
                time.sleep(1.0 * (attempt + 1))
        return None

    def fetch_current(self, lat: float, lon: float) -> dict:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m",
        }
        r = self._call_with_retry(params, self.timeout)
        if r is None:
            logger.warning(f"Open-Meteo failed for ({lat:.2f}, {lon:.2f}), using defaults")
            return {"temperature": 30, "humidity": 40, "wind": 5}

        data = r.json()
        current = data.get("current", {})
        return {
            "temperature": current.get("temperature_2m", 30),
            "humidity": current.get("relative_humidity_2m", 40),
            "wind": current.get("wind_speed_10m", 5),
        }

    def fetch_batch(self, points: list[tuple[float, float]]) -> list[dict]:
        if not points:
            return []

        lats = ",".join(str(p[0]) for p in points)
        lons = ",".join(str(p[1]) for p in points)

        params = {
            "latitude": lats,
            "longitude": lons,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m",
        }
        r = self._call_with_retry(params, 15)
        if r is None:
            logger.warning(f"Open-Meteo batch failed for {len(points)} points, using defaults")
            return [{"temperature": 30, "humidity": 40, "wind": 5} for _ in points]

        data = r.json()
        locations = data if isinstance(data, list) else [data]
        results = []

        for i, loc in enumerate(locations):
            current = loc.get("current", {})
            results.append({
                "temperature": current.get("temperature_2m", 30),
                "humidity": current.get("relative_humidity_2m", 40),
                "wind": current.get("wind_speed_10m", 5),
            })

        return results


weather_client = OpenMeteoClient()
