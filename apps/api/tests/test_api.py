import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PRIVACYLENS" in data["service"]

def test_tracker_catalog():
    response = client.get("/api/v1/trackers")
    assert response.status_code == 200
    data = response.json()
    assert "trackers" in data
    assert len(data["trackers"]) > 0

def test_policy_analyzer():
    sample_text = (
        "We share your personal data with third-party advertising partners to deliver tailored advertising. "
        "Under CCPA, you have the right to opt-out of the sale of personal information. "
        "We retain your data for 24 months."
    )
    response = client.post("/api/v1/policy/analyze", json={"url": "https://example.com/privacy", "text": sample_text})
    assert response.status_code == 200
    data = response.json()
    assert data["total_claims"] >= 2

def test_scan_and_copilot_flow():
    # Submit synthetic scan evidence
    scan_payload = {
        "url": "https://shop.sample-store.com",
        "events": [
            {
                "id": "e-1",
                "site": "shop.sample-store.com",
                "destination": "https://connect.facebook.net/en_US/fbevents.js",
                "destination_domain": "connect.facebook.net",
                "is_third_party": True,
                "resource_type": "script",
                "tracker_match": True,
                "tracker_category": "advertising",
                "tracker_owner": "Meta",
                "confidence": 0.98,
            },
            {
                "id": "e-2",
                "site": "shop.sample-store.com",
                "destination": "https://clarity.ms/s/0.7.20/clarity.js",
                "destination_domain": "clarity.ms",
                "is_third_party": True,
                "resource_type": "script",
                "tracker_match": True,
                "tracker_category": "fingerprinting",
                "tracker_owner": "Microsoft",
                "confidence": 0.95,
            }
        ],
        "cookies": [
            {
                "name": "_fbp",
                "domain": ".sample-store.com",
                "is_secure": False,
                "is_httponly": False,
                "category": "advertising",
                "is_third_party": True,
            }
        ],
        "storage": [],
        "permissions": [],
        "policy_claims": []
    }

    scan_res = client.post("/api/v1/scans", json=scan_payload)
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["domain"] == "shop.sample-store.com"
    assert scan_data["trackers_count"] == 2
    assert "score" in scan_data
    # Fingerprinting + Ads + Insecure cookie + Missing policy -> High risk / low privacy score
    assert scan_data["score"]["overall_privacy_score"] < 70

    # Query Copilot for this scan
    copilot_res = client.post(
        "/api/v1/copilot/chat",
        json={
            "scan_id": scan_data["id"],
            "question": "Why is this site considered risky?"
        }
    )
    assert copilot_res.status_code == 200
    copilot_data = copilot_res.json()
    assert "Privacy Assessment" in copilot_data["answer"]
    assert len(copilot_data["citations"]) > 0
