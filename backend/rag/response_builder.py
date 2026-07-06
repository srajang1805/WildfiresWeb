import json
from pathlib import Path
from backend.rag.geo_lookup import _extract_location as geo_extract

def detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["predict", "forecast", "risk for", "wildfire at", "fire in", "check"]): return "Predict"
    if any(w in q for w in ["most fire", "highest risk", "prone", "worst", "most at risk", "dangerous"]): return "HighestRisk"
    if any(w in q for w in ["risk", "danger", "probability", "level"]): return "Explain Risk"
    if any(w in q for w in ["weather", "temperature", "humidity", "wind", "vpd"]): return "Weather"
    if any(w in q for w in ["corbett", "kanha", "periyar", "similipal", "kaziranga", "forest", "park", "reserve"]): return "Forest Information"
    if any(w in q for w in ["model", "ml", "xgboost", "shap", "feature"]): return "Model"
    if any(w in q for w in ["prevent", "safety", "protect", "avoid"]): return "Prevention"
    if any(w in q for w in ["emergency", "evacuation", "fire", "call"]): return "Emergency"
    if any(w in q for w in ["use", "help", "guide", "how", "dashboard"]): return "Dashboard Help"
    return "General"


def _extract_location(query: str) -> tuple[str, float, float] | None:
    return geo_extract(query)


def risk_label(risk: float) -> str:
    if risk < 20: return "Low"
    if risk < 40: return "Moderate"
    if risk < 65: return "High"
    if risk < 85: return "Very High"
    return "Extreme"


def _action_recommendations(risk: float) -> str:
    if risk < 20:
        return "Standard monitoring is sufficient. No immediate action required."
    if risk < 40:
        return "Increase awareness. Review fire safety plans. Ensure firebreaks are maintained."
    if risk < 65:
        return "Alert local authorities. Increase patrol frequency. Prepare evacuation routes. Restrict open burning within 5 km."
    if risk < 85:
        return "Issue public warnings. Deploy fire response teams. Clear firebreaks immediately. Restrict public access to forest areas. Prepare evacuation centers."
    return "CRITICAL: Declare emergency. Evacuate at-risk populations within 20 km. Deploy all available firefighting resources. Request aerial support. Establish incident command. Ban all open fires within 50 km."


def _find_highest_risk_point(points: list[dict]) -> dict | None:
    if not points:
        return None
    return max(points, key=lambda p: p.get("risk", 0))


def _fetch_prediction(lat: float, lon: float) -> dict:
    try:
        import urllib.request
        url = f"http://localhost:8001/api/v1/predict?lat={lat}&lon={lon}"
        with urllib.request.urlopen(url, timeout=5) as r:
            return json.loads(r.read())
    except Exception:
        return {"wildfire_risk": None, "temperature": None, "humidity": None, "wind": None}


def _fetch_heatmap() -> dict:
    try:
        import urllib.request
        with urllib.request.urlopen("http://localhost:8001/api/v1/heatmap", timeout=5) as r:
            return json.loads(r.read())
    except Exception:
        return {"points": []}


def build_response(query: str, retrieved: list[dict], context: dict | None = None) -> dict:
    intent = detect_intent(query)
    seen = set()
    unique = [r for r in retrieved if r["id"] not in seen and not seen.add(r["id"])]
    top = unique[:3]
    lines = []

    if intent == "Predict":
        loc = _extract_location(query)
        if loc:
            name, lat, lon = loc
            pred = _fetch_prediction(lat, lon)
            risk = pred.get("wildfire_risk")
            if risk is not None:
                lines.append(f"## Wildfire Prediction: {name}")
                lines.append("")
                lines.append(f"**Location**: {lat:.4f}°N, {lon:.4f}°E")
                lines.append(f"**Risk Level**: **{risk_label(risk)}** ({risk:.1f}%)")
                lines.append(f"**Temperature**: {pred.get('temperature', 'N/A')}°C")
                lines.append(f"**Humidity**: {pred.get('humidity', 'N/A')}%")
                lines.append(f"**Wind Speed**: {pred.get('wind', 'N/A')} m/s")
                lines.append("")
                lines.append("### Recommended Actions")
                lines.append("")
                lines.append(_action_recommendations(risk))
                lines.append("")
                lines.append("### Why This Risk Level?")
                for r in top:
                    lines.append(f"- **{r['title']}**: {r['content']}")
            else:
                lines.append(f"Could not fetch prediction for {name}.")
        else:
            lines.append("## Location not recognized")
            lines.append("")
            lines.append("Try specifying a city name like 'Delhi', 'Bhopal', or a reserve like 'Kanha'.")

    elif intent == "HighestRisk":
        heatmap = _fetch_heatmap()
        highest = _find_highest_risk_point(heatmap.get("points", []))
        if highest:
            r = highest.get("risk", 0)
            lat = highest.get("lat", 0)
            lon = highest.get("lon", 0)
            loc_name = f"({lat:.2f}°N, {lon:.2f}°E)"
            from backend.rag.geo_lookup import _LOCATIONS as gl
            import json
            try:
                with open(Path(__file__).parent.parent / "knowledge" / "india_locations.json") as f:
                    all_locs = json.load(f)
                best, best_d = None, 999
                for loc in all_locs:
                    d = abs(loc["lat"] - lat) + abs(loc["lon"] - lon)
                    if d < best_d:
                        best_d = d
                        best = loc["name"]
                if best and best_d < 2.0:
                    loc_name = f"{best} (near {lat:.2f}°N, {lon:.2f}°E)"
            except Exception:
                pass
            lines.append("## Most Fire-Prone Region Currently")
            lines.append("")
            lines.append(f"**Location**: {loc_name}")
            lines.append(f"**Risk Level**: **{risk_label(r)}** ({r:.1f}%)")
            lines.append("")
            lines.append("### Recommended Actions")
            lines.append("")
            lines.append(_action_recommendations(r))
            lines.append("")
            lines.append("### Contributing Factors")
            for r in top:
                lines.append(f"- **{r['title']}**: {r['content']}")
        else:
            lines.append("Could not access current heatmap data.")

    elif intent == "Explain Risk":
        lines.append(f"## {intent}")
        lines.append("")
        if context:
            risk = context.get("risk", "Unknown")
            lines.append(f"**Current Risk**: {risk}")
            lines.append("")
        for r in top:
            lines.append(f"- **{r['title']}**: {r['content']}")
            lines.append("")

    else:
        lines.append(f"## {intent}")
        lines.append("")
        if context:
            risk = context.get("risk", "Unknown")
            temp = context.get("temperature", "N/A")
            hum = context.get("humidity", "N/A")
            wind = context.get("wind", "N/A")
            forest = context.get("forest", "")
            lines.append("### Current Conditions")
            lines.append("")
            lines.append(f"Risk: {risk} | Temp: {temp}°C | Humidity: {hum}% | Wind: {wind} m/s")
            if forest:
                lines.append(f"Reserve: {forest}")
            lines.append("")

        lines.append("### Key Information")
        lines.append("")
        for r in top:
            lines.append(f"- **{r['title']}**: {r['content']}")
            lines.append("")

    sources = list(set(r.get("category", "General") for r in top))
    confidence = min(1.0, sum(r.get("score", 0) for r in top) / len(top)) if top else 0.0

    return {
        "answer": "\n".join(lines),
        "sources": sources,
        "confidence": round(confidence, 2),
        "intent": intent,
    }
