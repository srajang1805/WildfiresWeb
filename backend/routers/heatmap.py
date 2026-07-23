import time
import threading
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter(prefix="/api/v1", tags=["heatmap"])

_heatmap_cache: list[dict] = []
_cache_time: str = ""
_lock = threading.Lock()

MODEL_AVAILABLE = False


def _generate_synthetic_heatmap(resolution: float = 0.5) -> list[dict]:
    import math
    import random

    random.seed(42)
    points = []
    lat = 6.5
    month = datetime.now().month

    while lat <= 38.0:
        lon = 67.0
        while lon <= 98.0:
            lat_factor = 1.0 - abs(lat - 22.0) / 20.0
            lon_factor = 1.0 - abs(lon - 80.0) / 15.0
            seasonal = 0.5 + 0.5 * math.sin(2 * math.pi * (month - 3) / 12)
            base_risk = max(0, lat_factor * lon_factor * seasonal * 100)
            risk = base_risk + random.uniform(-15, 15)
            risk = max(0, min(100, risk))

            if risk > 1:
                points.append({"lat": round(lat, 4), "lon": round(lon, 4), "risk": round(risk, 2)})
            lon += resolution
        lat += resolution

    return points


def _refresh_cache():
    global _heatmap_cache, _cache_time
    with _lock:
        try:
            if MODEL_AVAILABLE:
                from wildfire_engine.inference import predictor

                points = predictor.predict_heatmap(resolution=0.5)
            else:
                points = _generate_synthetic_heatmap(resolution=0.5)
            _heatmap_cache = points
            _cache_time = datetime.now(timezone.utc).isoformat()
            logger.info(f"Heatmap updated: {len(points)} points")

            from backend.routers.tiles import invalidate_cache, generate_heatmap_image
            invalidate_cache()
            generate_heatmap_image(points)
            logger.info("Heatmap image pre-generated")
        except Exception as e:
            logger.error(f"Heatmap refresh failed: {e}")


def _background_worker():
    _refresh_cache()
    while True:
        time.sleep(900)
        _refresh_cache()


_bg_thread = threading.Thread(target=_background_worker, daemon=True)


def start_heatmap_worker():
    if not _bg_thread.is_alive():
        _bg_thread.start()


@router.get("/heatmap")
def get_heatmap(resolution: float = Query(0.5, ge=0.1, le=2.0)):
    with _lock:
        points = _heatmap_cache
        cache_time = _cache_time

    if not points:
        _refresh_cache()
        with _lock:
            points = _heatmap_cache
            cache_time = _cache_time

    return JSONResponse(
        content={
            "points": points,
            "cached": True,
            "generated_at": cache_time,
        },
        headers={"Cache-Control": "public, max-age=300"},
    )
