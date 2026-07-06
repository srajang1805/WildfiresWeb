from fastapi import APIRouter, Query
import requests

router = APIRouter(prefix="/api/v1", tags=["search"])

INDIA_CITIES = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "hyderabad": (17.3850, 78.4867),
    "ahmedabad": (23.0225, 72.5714),
    "pune": (18.5204, 73.8567),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
    "chandigarh": (30.7333, 76.7794),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
    "nagpur": (21.1458, 79.0882),
    "patna": (25.5941, 85.1376),
    "guwahati": (26.1445, 91.7362),
    "shimla": (31.1048, 77.1734),
    "dehradun": (30.3165, 78.0322),
    "srinagar": (34.0837, 74.7973),
    "leh": (34.1526, 77.5771),
    "thiruvananthapuram": (8.5241, 76.9366),
    "port blair": (11.6234, 92.7265),
    "imphal": (24.8170, 93.9368),
    "aizawl": (23.7271, 92.7176),
    "gangtok": (27.3389, 88.6065),
    "itanagar": (27.0844, 93.6053),
    "kohima": (25.6747, 94.1086),
    "shillong": (25.5788, 91.8933),
    "agartala": (23.8315, 91.2868),
    "raipur": (21.2514, 81.6296),
    "ranchi": (23.3441, 85.3096),
    "bhubaneswar": (20.2961, 85.8245),
    "visakhapatnam": (17.6868, 83.2185),
    "kochi": (9.9312, 76.2673),
    "madurai": (9.9252, 78.1198),
    "varanasi": (25.3176, 82.9739),
    "agra": (27.1767, 78.0081),
    "amritsar": (31.6340, 74.8723),
    "jammu": (32.7266, 74.8570),
}

STATES = {
    "jammu and kashmir": (33.7782, 76.5762),
    "jammu & kashmir": (33.7782, 76.5762),
    "ladakh": (34.1526, 77.5771),
    "himachal pradesh": (31.1048, 77.1734),
    "punjab": (31.1471, 75.3412),
    "uttarakhand": (30.0668, 79.0193),
    "haryana": (29.0588, 76.0856),
    "rajasthan": (27.0238, 74.2179),
    "uttar pradesh": (26.8467, 80.9462),
    "bihar": (25.0961, 85.3131),
    "sikkim": (27.5330, 88.5122),
    "arunachal pradesh": (28.2180, 94.7278),
    "nagaland": (26.1584, 94.5624),
    "manipur": (24.6637, 93.9063),
    "mizoram": (23.1645, 92.9376),
    "tripura": (23.9408, 91.9882),
    "meghalaya": (25.4670, 91.3662),
    "assam": (26.2006, 92.9376),
    "west bengal": (22.9868, 87.8550),
    "jharkhand": (23.6102, 85.2799),
    "odisha": (20.9517, 85.0985),
    "chhattisgarh": (21.2787, 81.8661),
    "madhya pradesh": (22.9734, 78.6569),
    "gujarat": (22.2587, 71.1924),
    "maharashtra": (19.7515, 75.7139),
    "andhra pradesh": (15.9129, 79.7400),
    "karnataka": (15.3173, 75.7139),
    "goa": (15.2993, 74.1240),
    "kerala": (10.8505, 76.2711),
    "tamil nadu": (11.1271, 78.6569),
    "telangana": (18.1124, 79.0193),
}


@router.get("/search")
def search(q: str = Query(..., min_length=1)):
    q = q.strip().lower()

    if q in INDIA_CITIES:
        lat, lon = INDIA_CITIES[q]
        return {"found": True, "name": q.title(), "lat": lat, "lon": lon, "type": "city"}

    if q in STATES:
        lat, lon = STATES[q]
        return {"found": True, "name": q.title(), "lat": lat, "lon": lon, "type": "state"}

    for name, coords in {**INDIA_CITIES, **STATES}.items():
        if q in name or name.startswith(q):
            lat, lon = coords
            return {"found": True, "name": name.title(), "lat": lat, "lon": lon, "type": "partial"}

    try:
        parts = q.replace(" ", "").split(",")
        if len(parts) == 2:
            lat = float(parts[0])
            lon = float(parts[1])
            if 6 <= lat <= 38 and 66 <= lon <= 100:
                return {"found": True, "name": f"{lat}, {lon}", "lat": lat, "lon": lon, "type": "coordinates"}
    except ValueError:
        pass

    return {"found": False}
