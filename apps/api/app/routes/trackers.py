import json
import os
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/trackers", tags=["trackers"])

TRACKER_JSON_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "intelligence", "tracker_database", "trackers.json"
)

@router.get("")
def get_tracker_catalog():
    if os.path.exists(TRACKER_JSON_PATH):
        with open(TRACKER_JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"trackers": [], "categories": []}

