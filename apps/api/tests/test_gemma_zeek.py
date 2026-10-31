import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

def test_zeek_audit_clean_conformant():
    payload = {
        "domain": "ethical-blog.org",
        "policy_text": "We share aggregated analytics data with trusted analytics partners. We retain data for 12 months.",
        "observed_events": [
            {
                "id": "e-1",
                "site": "ethical-blog.org",
                "destination": "https://analytics.google.com/collect",
                "destination_domain": "analytics.google.com",
                "is_third_party": True,
                "tracker_match": True,
                "tracker_category": "analytics",
                "tracker_owner": "Google",
            }
        ]
    }
    res = client.post("/api/v1/policy/zeek-audit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "wire_verified"
    assert data["zeek_audit"]["wire_verdict"] == "CLEAN_CONFORMANT"
    assert len(data["zeek_audit"]["discrepancies"]) == 0
    assert data["consensus_score"] == 1.0

def test_zeek_audit_undisclosed_screen_recorder():
    payload = {
        "domain": "sneakystore.com",
        "policy_text": "We respect user privacy and do not track users across websites.",
        "observed_events": [
            {
                "id": "e-clarity",
                "site": "sneakystore.com",
                "destination": "https://c.clarity.ms/collect",
                "destination_domain": "c.clarity.ms",
                "is_third_party": True,
                "tracker_match": True,
                "tracker_category": "screen_recording",
                "tracker_owner": "Microsoft Clarity",
            }
        ]
    }
    res = client.post("/api/v1/policy/zeek-audit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "discrepancies_detected"
    assert len(data["zeek_audit"]["discrepancies"]) >= 1
    recorder_disc = next(d for d in data["zeek_audit"]["discrepancies"] if d["discrepancy_type"] == "undisclosed_screen_recorder")
    assert recorder_disc["severity"] == "critical"
    assert "Microsoft Clarity" in data["zeek_audit"]["screen_recorders_detected"]

def test_zeek_audit_policy_contradiction():
    payload = {
        "domain": "contradictory-site.com",
        "policy_text": "We do not sell or share any user personal information with third parties.",
        "observed_events": [
            {"id": f"e-{i}", "site": "contradictory-site.com", "destination": f"https://tracker{i}.com/t", "destination_domain": f"tracker{i}.com", "is_third_party": True, "tracker_match": True, "tracker_category": "advertising", "tracker_owner": f"AdTech {i}"}
            for i in range(1, 5)
        ]
    }
    res = client.post("/api/v1/policy/zeek-audit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "discrepancies_detected"
    assert any(d["discrepancy_type"] == "policy_contradiction" for d in data["zeek_audit"]["discrepancies"])

