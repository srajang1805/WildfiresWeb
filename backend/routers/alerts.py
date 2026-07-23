from fastapi import APIRouter, Query
from backend.services.geo_fence import get_alerts, get_zone_summary

router = APIRouter(prefix="/api/v1", tags=["alerts"])


@router.get("/alerts")
def alerts(limit: int = Query(20, ge=1, le=100)):
    return {"alerts": get_alerts(limit), "count": len(get_alerts(limit))}


@router.get("/alerts/summary")
def alerts_summary():
    return {"zones": get_zone_summary()}
