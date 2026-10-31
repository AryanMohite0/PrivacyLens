import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.services.zeek_log_parser import ZeekLogParser
from apps.api.app.schemas.schemas import ZeekEvidenceRecord

client = TestClient(app)

SAMPLE_ZEEK_TSV = """#separator \\x09
#set_separator	,
#empty_field	(empty)
#unset_field	-
#path	privacylens_audit
#open	2026-10-31-14-00-00
#fields	ts	uid	proto	host	uri	method	is_tracker	tracker_name	tracker_category	is_screen_recorder	is_cname_cloaked	cname_target	audit_note
#types	time	string	string	string	string	string	bool	string	string	bool	bool	string	string
1730364900.123456	C_clarity_01	http	c.clarity.ms	/collect	POST	T	Microsoft Clarity	screen_recording	T	F	-	Active screen replay session telemetry captured on wire
1730364901.654321	C_fb_pixel_02	http	connect.facebook.net	/signals/config/991	GET	T	Meta Pixel	advertising	F	F	-	Third-party ad/analytics telemetry observed
1730364902.999888	C_cdn_static_03	http	static.nike.com	/assets/app.js	GET	F	-	-	F	F	-	Legitimate first-party CDN static asset
#close	2026-10-31-14-00-05
"""

SAMPLE_ZEEK_JSON = """{"ts": "1730364900.123", "uid": "C_clarity_01", "proto": "http", "host": "c.clarity.ms", "uri": "/collect", "method": "POST", "is_tracker": true, "tracker_name": "Microsoft Clarity", "tracker_category": "screen_recording", "is_screen_recorder": true, "audit_note": "Active screen replay session telemetry captured on wire"}
{"ts": "1730364901.654", "uid": "C_fb_pixel_02", "proto": "http", "host": "connect.facebook.net", "uri": "/signals/config", "method": "GET", "is_tracker": true, "tracker_name": "Meta Pixel", "tracker_category": "advertising", "is_screen_recorder": false, "audit_note": "Ad beacon telemetry"}
"""

SAMPLE_ZEEK_DNS = """#separator \\x09
#fields	query	qtype_name	answers
analytics.store.nike.com	CNAME	c.clarity.ms
track.store.nike.com	CNAME	ad.doubleclick.net
"""

def test_parse_zeek_tsv():
    records = ZeekLogParser.parse_zeek_tsv(SAMPLE_ZEEK_TSV)
    assert len(records) == 3

    clarity = records[0]
    assert clarity.host == "c.clarity.ms"
    assert clarity.is_tracker is True
    assert clarity.is_screen_recorder is True
    assert clarity.tracker_category == "screen_recording"
    assert clarity.tracker_name == "Microsoft Clarity"

    fb = records[1]
    assert fb.host == "connect.facebook.net"
    assert fb.is_tracker is True
    assert fb.is_screen_recorder is False
    assert fb.tracker_category == "advertising"

    cdn = records[2]
    assert cdn.host == "static.nike.com"
    assert cdn.is_tracker is False
    assert cdn.is_screen_recorder is False

def test_parse_zeek_json():
    records = ZeekLogParser.parse_zeek_json_lines(SAMPLE_ZEEK_JSON)
    assert len(records) == 2
    assert records[0].host == "c.clarity.ms"
    assert records[0].is_screen_recorder is True
    assert records[1].host == "connect.facebook.net"
    assert records[1].tracker_category == "advertising"

def test_detect_cname_cloaking():
    cloaked = ZeekLogParser.detect_cname_cloaking(SAMPLE_ZEEK_DNS)
    assert "analytics.store.nike.com" in cloaked
    assert cloaked["analytics.store.nike.com"] == "c.clarity.ms"

def test_format_console_log():
    record = ZeekEvidenceRecord(
        ts="1730364900.123",
        uid="C_test_01",
        proto="http",
        host="c.clarity.ms",
        uri="/collect",
        method="POST",
        is_tracker=True,
        tracker_name="Microsoft Clarity",
        tracker_category="screen_recording",
        is_screen_recorder=True,
        audit_note="Screen replay session active",
    )
    log_str = ZeekLogParser.format_console_log(record, color=False)
    assert "[ZEEK WIRE AUDIT]" in log_str
    assert "[SCREEN REPLAY DETECTED]" in log_str
    assert "c.clarity.ms" in log_str
    assert "C_test_01" in log_str

def test_api_zeek_raw_logs_audit():
    policy_text = "We collect basic analytics to monitor site traffic. We never sell your personal data."
    response = client.post(
        "/api/v1/policy/zeek-logs-audit",
        json={
            "domain": "store.nike.com",
            "policy_text": policy_text,
            "raw_zeek_log": SAMPLE_ZEEK_TSV,
            "format": "tsv",
            "dns_log": SAMPLE_ZEEK_DNS,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "store.nike.com"
    assert data["status"] == "discrepancies_detected"
    assert data["zeek_audit"]["wire_verdict"] == "DISCREPANCIES_DETECTED"
    
    # Check that undisclosed screen recorder was caught
    discrepancies = data["zeek_audit"]["discrepancies"]
    types = [d["discrepancy_type"] for d in discrepancies]
    assert "undisclosed_screen_recorder" in types

