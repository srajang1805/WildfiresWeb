import json
import time
import hashlib
import threading
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from shapely.geometry import Point, shape

logger = logging.getLogger(__name__)

GEOJSON_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "forest_zones.geojson"
FALLBACK_GEOJSON = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "forestReserves.geojson"

_zones: list[dict] = []
_polygons: dict[str, object] = {}
_alerts: list[dict] = []
_alert_lock = threading.Lock()
ALERT_TTL_HOURS = 24
DEDUP_WINDOW_MINUTES = 120
CHECK_INTERVAL_SECONDS = 300


def _load_zones():
    global _zones, _polygons
    path = GEOJSON_PATH if GEOJSON_PATH.exists() else FALLBACK_GEOJSON
    if not path.exists():
        logger.warning(f"GeoJSON not found at {path}")
        return

    with open(path) as f:
        data = json.load(f)

    _zones = []
    _polygons = {}
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})
        zone = {
            "id": props.get("id", "unknown"),
            "name": props.get("name", "Unknown"),
            "state": props.get("state", ""),
            "area": props.get("area", ""),
        }
        _zones.append(zone)
        try:
            _polygons[zone["id"]] = shape(geom)
        except Exception:
            pass

    logger.info(f"Loaded {len(_zones)} geo-fence zones")


def _point_in_zone(lat: float, lon: float, zone_id: str) -> bool:
    poly = _polygons.get(zone_id)
    if poly is None:
        return False
    try:
        return poly.contains(Point(lon, lat))
    except Exception:
        return False


def _find_containing_zone(lat: float, lon: float) -> dict | None:
    for zone in _zones:
        if _point_in_zone(lat, lon, zone["id"]):
            return zone
    return None


def _alert_key(lat: float, lon: float, zone_id: str, window_minutes: int = DEDUP_WINDOW_MINUTES) -> str:
    bucket = round(lat, 3), round(lon, 3), zone_id
    now = datetime.now(timezone.utc)
    window = now - timedelta(minutes=window_minutes)
    hour_bucket = now.strftime("%Y%m%d%H")
    raw = f"{bucket}_{hour_bucket}"
    return hashlib.md5(raw.encode()).hexdigest()


def _should_alert(detection: dict, zone: dict) -> bool:
    confidence = detection.get("confidence", "l")
    frp = detection.get("frp", 0)
    if confidence == "l" and frp < 1.0:
        return False
    return True


def _check_and_alert():
    global _alerts
    from backend.services.firms import get_firms

    firms_data, _ = get_firms()
    if not firms_data:
        return

    new_alerts = []
    now = datetime.now(timezone.utc)

    for detection in firms_data:
        lat = detection.get("lat")
        lon = detection.get("lon")
        if lat is None or lon is None:
            continue

        zone = _find_containing_zone(lat, lon)
        if zone is None:
            continue

        if not _should_alert(detection, zone):
            continue

        key = _alert_key(lat, lon, zone["id"])

        with _alert_lock:
            existing = any(a.get("key") == key for a in _alerts)

        if existing:
            continue

        alert = {
            "key": key,
            "zone_id": zone["id"],
            "zone_name": zone["name"],
            "state": zone["state"],
            "lat": lat,
            "lon": lon,
            "brightness": detection.get("brightness", 0),
            "frp": detection.get("frp", 0),
            "confidence": detection.get("confidence", "n"),
            "date": detection.get("date", ""),
            "detected_at": now.isoformat(),
            "status": "active",
        }
        new_alerts.append(alert)

    if new_alerts:
        with _alert_lock:
            cutoff = (now - timedelta(hours=ALERT_TTL_HOURS)).isoformat()
            _alerts = [a for a in _alerts if a["detected_at"] > cutoff]
            _alerts = new_alerts + _alerts
            _alerts = _alerts[:100]

        logger.info(f"{len(new_alerts)} new geo-fence alerts")


def _geo_fence_worker():
    _load_zones()
    _check_and_alert()
    while True:
        time.sleep(CHECK_INTERVAL_SECONDS)
        _check_and_alert()


_thread = threading.Thread(target=_geo_fence_worker, daemon=True)


def start_geo_fence_worker():
    if not _thread.is_alive():
        _thread.start()


def get_alerts(limit: int = 20) -> list[dict]:
    with _alert_lock:
        return _alerts[:limit]


def get_zone_summary() -> list[dict]:
    with _alert_lock:
        now = datetime.now(timezone.utc)
        cutoff = (now - timedelta(hours=24)).isoformat()
        recent = [a for a in _alerts if a["detected_at"] > cutoff]

    summary = {}
    for zone in _zones:
        zone_id = zone["id"]
        zone_alerts = [a for a in recent if a["zone_id"] == zone_id]
        max_frp = max((a["frp"] for a in zone_alerts), default=0)
        high_conf = sum(1 for a in zone_alerts if a["confidence"] == "h")

        status = "safe"
        if len(zone_alerts) >= 3:
            status = "active"
        elif len(zone_alerts) >= 1:
            status = "watch"

        summary[zone_id] = {
            "zone_id": zone_id,
            "zone_name": zone["name"],
            "state": zone["state"],
            "alert_count": len(zone_alerts),
            "max_frp": max_frp,
            "high_confidence": high_conf,
            "status": status,
        }

    return list(summary.values())
