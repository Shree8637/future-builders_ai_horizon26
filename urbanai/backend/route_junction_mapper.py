"""
Route → Junction Mapper
========================
Replaces the keyword-matching hack in v2 with a real routing API.

Two options provided:
  Option A — Google Maps Routes API  (needs API key, most accurate)
  Option B — OSRM (free, open-source, no API key needed)

Both options:
  1. Take source + destination as place names or lat/lng
  2. Get the actual road path (polyline) between them
  3. Check which dataset junctions lie close to that path
  4. Return only the relevant junctions for the LSTM to predict on
"""

import numpy as np
import requests
import math
from typing import Optional

# ─────────────────────────────────────────────
# KNOWN JUNCTIONS (from your CSV dataset)
# Add more as your dataset grows
# ─────────────────────────────────────────────
DATASET_JUNCTIONS = {
    "Andheri Junction (E)"     : {"lat": 19.1197, "lng": 72.8468, "junction_id": 0},
    "Bandra-Kurla Complex Entry": {"lat": 19.0596, "lng": 72.8656, "junction_id": 1},
    "Borivali Station Road"    : {"lat": 19.2307, "lng": 72.8567, "junction_id": 2},
    "Dadar TT Circle"          : {"lat": 19.0178, "lng": 72.8478, "junction_id": 3},
    "Ghatkopar Flyover"        : {"lat": 19.0860, "lng": 72.9081, "junction_id": 4},
}

# How close a junction must be to the route to be "on" the route (in km)
PROXIMITY_THRESHOLD_KM = 1.5


# ──────────────────────────────────────────────────────
# UTILITY: Haversine distance between two lat/lng points
# ──────────────────────────────────────────────────────
def haversine_km(lat1, lng1, lat2, lng2) -> float:
    """Straight-line distance between two GPS coordinates in km."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def min_distance_to_polyline(point_lat, point_lng, polyline: list) -> float:
    """
    Find the minimum distance from a point to any segment of a polyline.
    polyline : list of (lat, lng) tuples representing the road path
    """
    min_dist = float("inf")
    for coord in polyline:
        d = haversine_km(point_lat, point_lng, coord[0], coord[1])
        if d < min_dist:
            min_dist = d
    return min_dist


def junctions_on_route(polyline: list, threshold_km: float = PROXIMITY_THRESHOLD_KM) -> list:
    """
    Given a route polyline, return dataset junctions that lie within
    threshold_km of the route.
    """
    matched = []
    for name, info in DATASET_JUNCTIONS.items():
        dist = min_distance_to_polyline(info["lat"], info["lng"], polyline)
        if dist <= threshold_km:
            matched.append({
                "junction_name": name,
                "junction_id"  : info["junction_id"],
                "distance_to_route_km": round(dist, 3),
            })
    # Sort by distance so the closest junction comes first
    matched.sort(key=lambda x: x["distance_to_route_km"])
    return matched


# ──────────────────────────────────────────────────────────────────
# OPTION A — GOOGLE MAPS ROUTES API
# Docs: https://developers.google.com/maps/documentation/routes
# Cost: ~$0.005 per request (free tier: $200/month credit)
# ──────────────────────────────────────────────────────────────────
def decode_polyline(encoded: str) -> list:
    """
    Decode a Google Maps encoded polyline string into list of (lat, lng).
    Google encodes the path as a compressed string to save bandwidth.
    """
    coords = []
    index, lat, lng = 0, 0, 0
    while index < len(encoded):
        for is_lng in [False, True]:
            shift, result = 0, 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else result >> 1
            if is_lng:
                lng += delta
                coords.append((lat / 1e5, lng / 1e5))
            else:
                lat += delta
    return coords


def get_junctions_google_maps(
    source: str,
    destination: str,
    api_key: str,
    threshold_km: float = PROXIMITY_THRESHOLD_KM
) -> list:
    """
    Use Google Maps Routes API to get the road path, then find
    which dataset junctions lie on that path.

    Parameters
    ----------
    source      : place name e.g. "Andheri Station, Mumbai"
    destination : place name e.g. "Bandra Kurla Complex, Mumbai"
    api_key     : your Google Maps API key

    Returns
    -------
    list of matching junction dicts
    """
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
    }

    body = {
        "origin"     : {"address": source},
        "destination": {"address": destination},
        "travelMode" : "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",   # uses live traffic
    }

    response = requests.post(url, json=body, headers=headers, timeout=10)
    response.raise_for_status()
    data = response.json()

    # Extract encoded polyline from response
    encoded_polyline = data["routes"][0]["polyline"]["encodedPolyline"]
    polyline = decode_polyline(encoded_polyline)

    print(f"  [Google Maps] Route has {len(polyline)} path points")
    return junctions_on_route(polyline, threshold_km)


# ──────────────────────────────────────────────────────────────────
# OPTION B — OSRM  (Open Source Routing Machine)
# Free, no API key, uses OpenStreetMap data
# Public demo server: http://router.project-osrm.org
# For production: self-host → https://github.com/Project-OSRM/osrm-backend
# ──────────────────────────────────────────────────────────────────
def geocode_place_osm(place_name: str) -> Optional[tuple]:
    """
    Convert a place name to (lat, lng) using Nominatim (OpenStreetMap geocoder).
    Free, no API key needed.
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q"      : place_name,
        "format" : "json",
        "limit"  : 1,
        "countrycodes": "IN",  # restrict to India
    }
    headers = {"User-Agent": "MumbaiTrafficPredictor/1.0"}
    response = requests.get(url, params=params, headers=headers, timeout=10)
    response.raise_for_status()
    results = response.json()

    if not results:
        raise ValueError(f"Could not geocode: '{place_name}'. Try a more specific name.")

    lat = float(results[0]["lat"])
    lng = float(results[0]["lon"])
    print(f"  [OSM Geocode] '{place_name}' → ({lat:.4f}, {lng:.4f})")
    return lat, lng


def get_junctions_osrm(
    source: str,
    destination: str,
    threshold_km: float = PROXIMITY_THRESHOLD_KM,
    osrm_server: str = "http://router.project-osrm.org"
) -> list:
    """
    Use OSRM to get the driving route, then find dataset junctions on that path.

    Parameters
    ----------
    source      : place name e.g. "Andheri, Mumbai"
    destination : place name e.g. "BKC, Mumbai"
    osrm_server : use public demo or your self-hosted instance

    Returns
    -------
    list of matching junction dicts
    """

    # Step 1: Geocode source and destination to lat/lng
    src_lat, src_lng = geocode_place_osm(source)
    dst_lat, dst_lng = geocode_place_osm(destination)

    # Step 2: Call OSRM route API
    # Format: /route/v1/driving/lng,lat;lng,lat?overview=full&geometries=geojson
    url = (
        f"{osrm_server}/route/v1/driving/"
        f"{src_lng},{src_lat};{dst_lng},{dst_lat}"
        f"?overview=full&geometries=geojson"
    )

    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    if data["code"] != "Ok":
        raise ValueError(f"OSRM error: {data['code']}")

    # Step 3: Extract path coordinates
    # GeoJSON coordinates are [lng, lat] — swap to (lat, lng)
    coords = data["routes"][0]["geometry"]["coordinates"]
    polyline = [(c[1], c[0]) for c in coords]  # (lat, lng)

    distance_km = data["routes"][0]["distance"] / 1000
    duration_min = data["routes"][0]["duration"] / 60
    print(f"  [OSRM] Route: {distance_km:.1f} km, ~{duration_min:.0f} min, {len(polyline)} path points")

    # Step 4: Find junctions near this path
    return junctions_on_route(polyline, threshold_km)


# ──────────────────────────────────────────────────────────────────
# UNIFIED INTERFACE  — called from your main predict function
# ──────────────────────────────────────────────────────────────────
def get_route_junctions(
    source: str,
    destination: str,
    google_api_key: Optional[str] = None,
    threshold_km: float = PROXIMITY_THRESHOLD_KM,
) -> list:
    """
    Smart router: uses Google Maps if API key provided, else falls back to OSRM.

    Returns
    -------
    List of junction dicts, e.g.:
    [
      {"junction_name": "Andheri Junction (E)", "junction_id": 0, "distance_to_route_km": 0.3},
      {"junction_name": "Bandra-Kurla Complex Entry", "junction_id": 1, "distance_to_route_km": 0.8},
    ]
    """
    if google_api_key:
        print("  Using Google Maps Routes API...")
        junctions = get_junctions_google_maps(source, destination, google_api_key, threshold_km)
    else:
        print("  Using OSRM (free, no API key)...")
        junctions = get_junctions_osrm(source, destination, threshold_km)

    if not junctions:
        print(f"  ⚠ No dataset junctions found within {threshold_km} km of route.")
        print("    Try increasing threshold_km or check source/destination names.")
    else:
        print(f"  ✅ Found {len(junctions)} junction(s) on route:")
        for j in junctions:
            print(f"     → {j['junction_name']} ({j['distance_to_route_km']} km from path)")

    return junctions


# ──────────────────────────────────────────────────────────────────
# HOW THIS PLUGS INTO YOUR MAIN PREDICTION FUNCTION (from v2)
# ──────────────────────────────────────────────────────────────────
"""
Replace this in train_lstm_traffic_v2.py:

    junctions = get_relevant_junctions(source, destination)   ← OLD (keyword match)

With this:

    from route_junction_mapper import get_route_junctions

    junctions_info = get_route_junctions(
        source         = source,
        destination    = destination,
        google_api_key = "YOUR_KEY_HERE",   # or None to use OSRM
    )
    junctions = [j["junction_name"] for j in junctions_info]
"""


# ──────────────────────────────────────────────────────────────────
# EXAMPLE RUN
# ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("ROUTE → JUNCTION MAPPER — Example")
    print("=" * 55)

    SOURCE      = "Andheri Station, Mumbai"
    DESTINATION = "Bandra Kurla Complex, Mumbai"

    print(f"\nRoute: {SOURCE} → {DESTINATION}")
    print("-" * 55)

    # Using OSRM (free, no key needed)
    junctions = get_route_junctions(
        source      = SOURCE,
        destination = DESTINATION,
        google_api_key = None,   # swap in your Google key here
    )

    print("\nJunctions to run LSTM prediction on:")
    for j in junctions:
        print(f"  📍 {j['junction_name']}  ({j['distance_to_route_km']} km from route)")