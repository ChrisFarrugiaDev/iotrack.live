#!/usr/bin/env python3
"""Seed multiple vehicle assets with images via the backend + file server."""

import random
import requests

# ---------------------------------------------------------------------------
# Config — edit these before running
# ---------------------------------------------------------------------------

TOKEN       = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzI1Mjk5Mi0zZGEzLTQ5N2QtYTE3ZC00NzE5NDBiNjhiMGYiLCJpZCI6IjEiLCJlbWFpbCI6ImRldkB1c2VyLmNvbSIsInJvbGVfaWQiOjEsIm9yZ19pZCI6IjEiLCJ0b2tlbl92ZXJzaW9uIjoxLCJpYXQiOjE3ODMzNTk3MDAsImV4cCI6MTc4MzQwMjkwMH0.whOcO22y9FJi9tTa0PwB3cwm4bhyu-tEJMC4ySKM7SQ"

BACKEND_URL     = "http://57.129.22.122:4001"
FILE_SERVER_URL = "http://57.129.22.122:4002"

ORG_ID           = 11
FIRST_DEVICE_ID  = 185
ASSET_COUNT      = 25

# First image number (increments with each asset)
FIRST_IMAGE_NUM  = 76

IMAGE_DIR = "/home/foxcodenine/foxfiles/Pictures/Painting"

# ---------------------------------------------------------------------------
# Random name pool
# ---------------------------------------------------------------------------

ADJECTIVES = [
    "Blazing", "Crimson", "Dazzling", "Elegant", "Frosty",
    "Golden", "Hollow", "Ivory", "Jade", "Keen",
    "Lunar", "Mystic", "Noble", "Obsidian", "Phantom",
    "Radiant", "Silent", "Titan", "Urban", "Velvet",
    "Wicked", "Xenon", "Yellow", "Zealous", "Arctic",
    "Brisk", "Cobalt", "Dusk", "Ember", "Fierce",
    "Gilded", "Haunted", "Indigo", "Jagged", "Kinetic",
    "Languid", "Mellow", "Nimble", "Onyx", "Pristine",
    "Quarry", "Rustic", "Stormy", "Twilight", "Umber",
    "Vivid", "Waning", "Apex", "Bitter", "Clouded",
    "Desolate", "Eerie", "Flint", "Granite", "Hazy",
    "Iron", "Jagged", "Lofty", "Murky", "Neon",
    "Pale", "Quiet", "Rough", "Stark", "Tawny",
    "Ultramarine", "Vast", "Worn", "Ashen", "Bronze",
]

NOUNS = [
    "Allen", "Baker", "Carter", "Drake", "Evans",
    "Foster", "Grant", "Hayes", "Irving", "Jensen",
    "Knight", "Lane", "Mason", "Nash", "Owen",
    "Parker", "Quinn", "Reed", "Stone", "Turner",
    "Upton", "Vance", "Walsh", "Xander", "York",
    "Zane", "Archer", "Blake", "Chase", "Dean",
    "Ellis", "Flynn", "Gore", "Hunt", "Ingram",
    "Jarvis", "Kane", "Lloyd", "Marsh", "Nolan",
    "Oswald", "Pruitt", "Rowe", "Shaw", "Tate",
    "Underwood", "Voss", "Wren", "Cross", "Dunn",
    "Frost", "Gibbs", "Holt", "Iris", "Jett",
    "Kemp", "Lowe", "Moss", "Nunn", "Orr",
    "Pace", "Rand", "Sage", "Troy", "Vale",
    "Ward", "Knox", "Ford", "Bray", "Colt",
]

def random_name() -> str:
    return f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)}"

# ---------------------------------------------------------------------------

def create_asset(session: requests.Session, org_id: int, device_id: int, name: str) -> int:
    url  = f"{BACKEND_URL}/api/asset"
    body = {
        "organisation_id": str(org_id),
        "device_id":       str(device_id),
        "name":            name,
        "asset_type":      "vehicle",
        "attributes":      {},
    }
    r = session.post(url, json=body)
    r.raise_for_status()
    data = r.json()
    asset_id = data["data"]["asset"]["id"]
    print(f"  Created asset id={asset_id}  name='{name}'  device_id={device_id}")
    return asset_id


def upload_image(session: requests.Session, asset_id: int, image_path: str) -> None:
    url = f"{FILE_SERVER_URL}/img/upload"
    with open(image_path, "rb") as f:
        files  = {"images": (image_path.split("/")[-1], f, "image/jpeg")}
        data   = {"entity_type": "asset", "entity_id": str(asset_id)}
        r = session.post(url, files=files, data=data)
    r.raise_for_status()
    result = r.json()
    uploaded = result.get("data", {}).get("uploaded") or []
    if uploaded:
        print(f"  Uploaded image → {uploaded[0].get('url')}")
    errors = result.get("data", {}).get("errors") or []
    for e in errors:
        print(f"  Image error: {e}")


def main():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    session = requests.Session()
    session.headers.update(headers)

    for i in range(ASSET_COUNT):
        device_id  = FIRST_DEVICE_ID + i
        image_num  = FIRST_IMAGE_NUM + i
        image_path = f"{IMAGE_DIR}/{image_num:03d}.jpg"
        name       = random_name()

        print(f"\n[{i+1}/{ASSET_COUNT}] {name}")
        try:
            asset_id = create_asset(session, ORG_ID, device_id, name)
            upload_image(session, asset_id, image_path)
        except requests.HTTPError as e:
            print(f"  HTTP error: {e.response.status_code} — {e.response.text}")
        except FileNotFoundError:
            print(f"  Image not found: {image_path}")

    print("\nDone.")


if __name__ == "__main__":
    main()
