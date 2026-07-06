from fastapi import APIRouter
from backend.services.firms import get_firms

router = APIRouter(prefix="/api/v1", tags=["firms"])


@router.get("/firms")
def firms():
    data, updated = get_firms()
    return {"detections": data, "updated": updated, "count": len(data)}
