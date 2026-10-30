import uuid
import datetime
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..models.database import SessionLocal, Website, Scan, NetworkEvent, RiskFinding
from ..schemas.schemas import (
    ScanCreateRequest,
    ScanResponse,
    RiskScoreSchema,
    RealityGapFindingSchema,
)
from ..services.risk_engine import RiskEngine

router = APIRouter(prefix="/api/v1/scans", tags=["scans"])
risk_engine = RiskEngine()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url)
        return parsed.netloc or url.split("/")[0]
    except Exception:
        return url

@router.post("", response_model=ScanResponse)
def create_scan(req: ScanCreateRequest, db: Session = Depends(get_db)):
    domain = extract_domain(req.url)
    root_domain = ".".join(domain.split(".")[-2:]) if "." in domain else domain

    # Find or create website
    website = db.query(Website).filter(Website.domain == domain).first()
    if not website:
        website = Website(
            id=f"site-{uuid.uuid4().hex[:8]}",
            domain=domain,
            root_domain=root_domain,
            first_scanned_at=datetime.datetime.utcnow(),
            last_scanned_at=datetime.datetime.utcnow(),
        )
        db.add(website)
    else:
        website.last_scanned_at = datetime.datetime.utcnow()
    db.commit()

    # Calculate deterministic risk score & findings
    score, findings = risk_engine.assess(
        site=domain,
        events=req.events,
        cookies=req.cookies,
        storage=req.storage,
        permissions=req.permissions,
        policy_claims=req.policy_claims,
        policy_discovered=len(req.policy_claims) > 0,
    )

    scan_id = f"scan-{uuid.uuid4().hex[:12]}"
    scan = Scan(
        id=scan_id,
        website_id=website.id,
        url=req.url,
        overall_score=score.overall_privacy_score,
        risk_score=score.risk_score,
        t_score=score.tracking_exposure,
        c_score=score.cookie_exposure,
        p_score=score.permission_exposure,
        d_score=score.disclosure_concerns,
        grade=score.grade,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(scan)

    # Store network events
    for evt in req.events:
        db_evt = NetworkEvent(
            id=f"{scan_id}-{evt.id}" if evt.id else f"evt-{uuid.uuid4().hex[:8]}",
            scan_id=scan_id,
            destination=evt.destination,
            destination_domain=evt.destination_domain,
            resource_type=evt.resource_type,
            is_third_party=evt.is_third_party,
            tracker_match=evt.tracker_match,
            tracker_category=evt.tracker_category,
            tracker_owner=evt.tracker_owner,
            confidence=evt.confidence,
            timestamp=datetime.datetime.utcnow(),
        )
        db.add(db_evt)

    # Store findings
    for f in findings:
        db_f = RiskFinding(
            id=f"{scan_id}-{f.id}" if f.id else f"f-{uuid.uuid4().hex[:8]}",
            scan_id=scan_id,
            category=f.category,
            title=f.title,
            observed_behavior=f.observed_behavior,
            policy_claim=f.policy_claim,
            status=f.status,
            severity=f.severity,
            evidence_references=",".join(f.evidence_references),
            explanation=f.explanation,
        )
        db.add(db_f)

    db.commit()

    trackers_count = sum(1 for e in req.events if e.tracker_match)
    return ScanResponse(
        id=scan.id,
        url=scan.url,
        domain=website.domain,
        root_domain=website.root_domain,
        created_at=scan.created_at.isoformat(),
        score=score,
        findings=findings,
        total_events=len(req.events),
        trackers_count=trackers_count,
        cookies_count=len(req.cookies),
    )

@router.get("/by-domain/{domain}")
def get_scan_by_domain(domain: str, db: Session = Depends(get_db)):
    website = db.query(Website).filter(Website.domain == domain).first()
    if not website:
        raise HTTPException(status_code=404, detail="No scan found for this domain")

    latest_scan = (
        db.query(Scan)
        .filter(Scan.website_id == website.id)
        .order_by(Scan.created_at.desc())
        .first()
    )
    if not latest_scan:
        raise HTTPException(status_code=404, detail="No scan sessions found for domain")

    findings = [
        RealityGapFindingSchema(
            id=f.id,
            category=f.category,
            title=f.title,
            observed_behavior=f.observed_behavior,
            policy_claim=f.policy_claim,
            status=f.status,
            severity=f.severity,
            evidence_references=f.evidence_references.split(",") if f.evidence_references else [],
            explanation=f.explanation,
        )
        for f in latest_scan.findings
    ]

    score = RiskScoreSchema(
        overall_privacy_score=latest_scan.overall_score,
        risk_score=latest_scan.risk_score,
        tracking_exposure=latest_scan.t_score,
        cookie_exposure=latest_scan.c_score,
        permission_exposure=latest_scan.p_score,
        disclosure_concerns=latest_scan.d_score,
        grade=latest_scan.grade,
        calculated_at=latest_scan.created_at.isoformat(),
    )

    trackers = [
        {
            "id": e.id,
            "destination_domain": e.destination_domain,
            "category": e.tracker_category,
            "owner": e.tracker_owner,
            "resource_type": e.resource_type,
        }
        for e in latest_scan.events
        if e.tracker_match
    ]

    return {
        "id": latest_scan.id,
        "url": latest_scan.url,
        "domain": website.domain,
        "root_domain": website.root_domain,
        "created_at": latest_scan.created_at.isoformat(),
        "score": score,
        "findings": findings,
        "trackers": trackers,
        "events_count": len(latest_scan.events),
    }

@router.get("")
def list_scans(limit: int = 10, db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(Scan.created_at.desc()).limit(limit).all()
    results = []
    for s in scans:
        website = db.query(Website).filter(Website.id == s.website_id).first()
        results.append({
            "id": s.id,
            "domain": website.domain if website else "unknown",
            "url": s.url,
            "overall_score": s.overall_score,
            "risk_score": s.risk_score,
            "grade": s.grade,
            "created_at": s.created_at.isoformat(),
        })
    return results
