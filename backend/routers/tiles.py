import io
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
GEOJSON_PATH = DATA_DIR / "india.geojson"

with open(GEOJSON_PATH) as f:
    _geojson = json.load(f)

IMG_W = 1400
IMG_H = 1800
_LAT_S = 4.0
_LON_W = 64.0
_LAT_N = 40.0
_LON_E = 100.0
CIRCLE_R = 12
BLUR_R = 8

_heatmap_image: bytes | None = None
_india_mask: Image.Image | None = None


def _build_mask():
    global _india_mask
    if _india_mask is not None:
        return _india_mask
    m = Image.new("L", (IMG_W, IMG_H), 0)
    d = ImageDraw.Draw(m)
    for f in _geojson["features"]:
        g = f["geometry"]
        rings = g["coordinates"] if g["type"] == "Polygon" else [r for p in g["coordinates"] for r in p]
        for ring in rings:
            pts = [(int((lon - _LON_W) / (_LON_E - _LON_W) * (IMG_W - 1)), int((_LAT_N - lat) / (_LAT_N - _LAT_S) * (IMG_H - 1))) for lon, lat in ring]
            d.polygon(pts, fill=255)
    _india_mask = m
    return m


def _risk_to_rgba(risk):
    r = max(0, min(1, risk / 100))
    if r < 0.05: return (0, 180, 0, 100)
    elif r < 0.20: return (255, 220, 0, 100)
    elif r < 0.50: return (255, 140, 0, 120)
    elif r < 0.80: return (220, 0, 0, 140)
    else: return (140, 0, 200, 160)


def invalidate_cache():
    global _heatmap_image, _india_mask
    _heatmap_image = None
    _india_mask = None


def generate_heatmap_image(points: list[dict]) -> bytes:
    global _heatmap_image
    if _heatmap_image is not None:
        return _heatmap_image

    img = Image.new("RGBA", (IMG_W, IMG_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for p in points:
        x = int((p["lon"] - _LON_W) / (_LON_E - _LON_W) * (IMG_W - 1))
        y = int((_LAT_N - p["lat"]) / (_LAT_N - _LAT_S) * (IMG_H - 1))
        draw.ellipse([x - CIRCLE_R, y - CIRCLE_R, x + CIRCLE_R, y + CIRCLE_R], fill=_risk_to_rgba(p["risk"]))

    img = img.filter(ImageFilter.GaussianBlur(radius=BLUR_R))

    mask = _build_mask()
    result = Image.new("RGBA", (IMG_W, IMG_H), (0, 0, 0, 0))
    result.paste(img, mask=mask)

    buf = io.BytesIO()
    result.save(buf, format="PNG")
    _heatmap_image = buf.getvalue()
    return _heatmap_image
