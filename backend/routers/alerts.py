from fastapi import APIRouter, Query
from backend.services.geo_fence import get_alerts, get_zone_summary

router = APIRouter(prefix="/api/v1", tags=["alerts"])


@router.get("/alerts")
def alerts(limit: int = Query(20, ge=1, le=100)):
    data = get_alerts(int(limit))
    return {"alerts": data, "count": len(data)}


@router.get("/alerts/summary")
def alerts_summary():
    return {"zones": get_zone_summary()}
