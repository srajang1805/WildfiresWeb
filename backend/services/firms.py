import time
import threading
import logging
import requests
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_firms_cache: list[dict] = []
_firms_cache_time: str = ""
_firms_lock = threading.Lock()
FIRMS_CACHE_TTL = 3600

FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/country/csv/79884934cf23d4648ea9e2beeda8fdde/VIIRS_NOAA20_NRT/IND/1"


def _fetch_firms() -> list[dict]:
    try:
        r = requests.get(FIRMS_URL, timeout=30)
        r.raise_for_status()
        lines = r.text.strip().split("\n")
        if len(lines) < 2:
            return []

        header = lines[0].split(",")
        lat_idx = header.index("latitude")
        lon_idx = header.index("longitude")
        bright_idx = header.index("bright_ti4") if "bright_ti4" in header else -1
        frp_idx = header.index("frp") if "frp" in header else -1
        acq_idx = header.index("acq_date") if "acq_date" in header else -1
        conf_idx = header.index("confidence") if "confidence" in header else -1

        results = []
        for line in lines[1:]:
            parts = line.split(",")
            try:
                point = {
                    "lat": float(parts[lat_idx]),
                    "lon": float(parts[lon_idx]),
                    "brightness": float(parts[bright_idx]) if bright_idx >= 0 else 0,
                    "frp": float(parts[frp_idx]) if frp_idx >= 0 else 0,
                    "date": parts[acq_idx].strip() if acq_idx >= 0 else "",
                    "confidence": parts[conf_idx].strip() if conf_idx >= 0 else "n",
                }
                results.append(point)
            except (ValueError, IndexError):
                continue

        return results
    except Exception as e:
        logger.error(f"FIRMS fetch failed: {e}")
        return []


def _refresh_firms():
    global _firms_cache, _firms_cache_time
    with _firms_lock:
        data = _fetch_firms()
        if data:
            _firms_cache = data
            _firms_cache_time = datetime.now(timezone.utc).isoformat()
            logger.info(f"FIRMS updated: {len(data)} detections")


def _firms_worker():
    while True:
        _refresh_firms()
        time.sleep(FIRMS_CACHE_TTL)


_thread = threading.Thread(target=_firms_worker, daemon=True)


def start_firms_worker():
    if not _thread.is_alive():
        _thread.start()


def get_firms() -> tuple[list[dict], str]:
    with _firms_lock:
        return _firms_cache, _firms_cache_time
