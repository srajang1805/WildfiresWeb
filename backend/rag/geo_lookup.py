import json
import difflib
from pathlib import Path

_LOCATIONS: list[dict] = []
_SEARCH_NAMES: list[str] = []
_ALIAS_MAP: dict[str, str] = {}


def _load():
    global _LOCATIONS, _SEARCH_NAMES, _ALIAS_MAP
    if _LOCATIONS:
        return
    path = Path(__file__).parent.parent / "knowledge" / "india_locations.json"
    if not path.exists():
        return
    with open(path, encoding="utf-8") as f:
        _LOCATIONS = json.load(f)
    _SEARCH_NAMES = []
    for loc in _LOCATIONS:
        _SEARCH_NAMES.append(loc["name"].lower())
        _ALIAS_MAP[loc["name"].lower()] = loc["name"]
        for alias in loc.get("aliases", []):
            _SEARCH_NAMES.append(alias.lower())
            _ALIAS_MAP[alias.lower()] = loc["name"]


def fuzzy_find(query: str) -> dict | None:
    _load()
    if not _LOCATIONS:
        return None
    q = query.lower().strip()

    # Exact match
    if q in _ALIAS_MAP:
        canonical = _ALIAS_MAP[q]
        for loc in _LOCATIONS:
            if loc["name"] == canonical:
                return loc

    # Direct substring match
    for loc in _LOCATIONS:
        name_lower = loc["name"].lower()
        if q in name_lower or name_lower in q:
            return loc
        for alias in loc.get("aliases", []):
            if q in alias.lower() or alias.lower() in q:
                return loc

    # Fuzzy match
    matches = difflib.get_close_matches(q, _SEARCH_NAMES, n=3, cutoff=0.7)
    if matches:
        canonical = _ALIAS_MAP.get(matches[0], matches[0])
        for loc in _LOCATIONS:
            if loc["name"] == canonical:
                return loc

    # Very loose - check if any word matches
    words = q.split()
    for word in words:
        if len(word) < 3:
            continue
        for loc in _LOCATIONS:
            if word in loc["name"].lower():
                return loc
        for name, canonical in _ALIAS_MAP.items():
            if word in name:
                return next((l for l in _LOCATIONS if l["name"] == canonical), None)

    return None


def _extract_location(query: str) -> tuple[str, float, float] | None:
    loc = fuzzy_find(query)
    if loc:
        return loc["name"], loc["lat"], loc["lon"]
    return None
