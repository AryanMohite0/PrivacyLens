import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.services.stgnn_engine import stgnn_engine
from apps.api.app.schemas.schemas import EvidenceEventSchema

client = TestClient(app)

def create_sample_events():
    return [
        EvidenceEventSchema(
            id="e1",
            site="store.nike.com",
            destination="https://store.nike.com/home",
            destination_domain="store.nike.com",
            is_third_party=False,
            resource_type="main_frame",
            tracker_match=False,
            risk="low",
        ),
        EvidenceEventSchema(
            id="e2",
            site="store.nike.com",
            destination="https://c.clarity.ms/collect",
            destination_domain="c.clarity.ms",
            is_third_party=True,
            resource_type="script",
            tracker_match=True,
            tracker_owner="Microsoft",
            tracker_category="screen_recording",
            risk="critical",
        ),
        EvidenceEventSchema(
            id="e3",
            site="store.nike.com",
            destination="https://connect.facebook.net/en_US/fbevents.js",
            destination_domain="connect.facebook.net",
            is_third_party=True,
            resource_type="script",
            tracker_match=True,
            tracker_owner="Meta",
            tracker_category="advertising",
            risk="high",
        ),
        EvidenceEventSchema(
            id="e4",
            site="store.nike.com",
            destination="https://google-analytics.com/g/collect?v=2",
            destination_domain="google-analytics.com",
            is_third_party=True,
            resource_type="ping",
            tracker_match=True,
            tracker_owner="Google",
            tracker_category="analytics",
            risk="medium",
        ),
        EvidenceEventSchema(
            id="e5",
            site="store.nike.com",
            destination="https://c.clarity.ms/stream/replay/burst",
            destination_domain="c.clarity.ms",
            is_third_party=True,
            resource_type="websocket",
            tracker_match=True,
            tracker_owner="Microsoft",
            tracker_category="screen_recording",
            risk="critical",
        ),
    ]

def test_stgnn_graph_construction():
    events = create_sample_events()
    nodes, A_hat, X, edges = stgnn_engine.build_spatio_temporal_graph("store.nike.com", events)

    assert len(nodes) == 4
    assert "store.nike.com" in nodes
    assert "c.clarity.ms" in nodes
    assert "connect.facebook.net" in nodes
    assert "google-analytics.com" in nodes

    # Check normalized adjacency dimensions
    assert len(A_hat) == 4
    assert len(A_hat[0]) == 4
    # Self-loops must be non-zero
    for i in range(4):
        assert A_hat[i][i] > 0.0

    # Check feature tensor X dimensions: (N x T x F)
    assert len(X) == 4
    assert len(X[0]) == stgnn_engine.time_slices
    assert len(X[0][0]) == stgnn_engine.feature_dim

def test_stgnn_forward_inference():
    events = create_sample_events()
    report = stgnn_engine.analyze_session("store.nike.com", events)

    assert report.total_nodes == 4
    assert report.total_edges > 0
    assert report.spatio_temporal_risk_score > 0

    # Verify predictions per node
    preds_map = {p.domain: p for p in report.predictions}
    assert "c.clarity.ms" in preds_map
    clarity_pred = preds_map["c.clarity.ms"]
    assert clarity_pred.tracker_probability >= 0.90
    assert clarity_pred.classification == "screen_recording"
    assert clarity_pred.is_evasive is True

    fb_pred = preds_map["connect.facebook.net"]
    assert fb_pred.tracker_probability >= 0.80
    assert fb_pred.classification == "ad_retargeting"

    first_party = preds_map["store.nike.com"]
    assert first_party.classification == "first_party"
    assert first_party.tracker_probability < 0.20

    # Critical leakage path should originate at first party and flow to screen recorder
    assert report.critical_leakage_path[0] == "store.nike.com"
    assert "c.clarity.ms" in report.critical_leakage_path

def test_api_stgnn_evaluate_endpoint():
    events = [e.model_dump() for e in create_sample_events()]
    response = client.post(
        "/api/v1/policy/stgnn-evaluate",
        json={
            "domain": "store.nike.com",
            "events": events,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model"].startswith("PRIVACYLENS STGNN")
    assert data["total_nodes"] == 4
    assert len(data["predictions"]) == 4
    assert data["spatio_temporal_risk_score"] > 20
    assert data["risk_level"] in ["Moderate", "Elevated", "Severe"]
