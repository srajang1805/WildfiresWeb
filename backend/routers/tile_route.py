from fastapi import APIRouter, Response
from backend.routers import heatmap as heatmap_module
from backend.routers.tiles import generate_heatmap_image

router = APIRouter(prefix="/api/v1", tags=["tiles"])


@router.get("/heatmap-image.png")
def heatmap_image():
    points = heatmap_module._heatmap_cache
    if not points:
        heatmap_module._refresh_cache()
        points = heatmap_module._heatmap_cache
    png = generate_heatmap_image(points)
    return Response(content=png, media_type="image/png")
