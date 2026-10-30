from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import SessionLocal, Scan, Website
from ..schemas.schemas import CopilotQueryRequest, CopilotQueryResponse
from ..services.copilot import privacy_copilot

router = APIRouter(prefix="/api/v1/copilot", tags=["copilot"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/chat", response_model=CopilotQueryResponse)
def copilot_chat(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    domain = req.domain or "unknown"
    findings = []
    trackers = []
    cookies = []
    score = {
        "overall_privacy_score": 65,
        "risk_score": 35,
        "tracking_exposure": 50,
        "cookie_exposure": 30,
        "permission_exposure": 0,
        "disclosure_concerns": 25,
        "grade": "C",
    }

    if req.scan_id:
        scan = db.query(Scan).filter(Scan.id == req.scan_id).first()
        if scan:
            website = db.query(Website).filter(Website.id == scan.website_id).first()
            if website:
                domain = website.domain

            score = {
                "overall_privacy_score": scan.overall_score,
                "risk_score": scan.risk_score,
                "tracking_exposure": scan.t_score,
                "cookie_exposure": scan.c_score,
                "permission_exposure": scan.p_score,
                "disclosure_concerns": scan.d_score,
                "grade": scan.grade,
            }

            findings = [
                {
                    "id": f.id,
                    "title": f.title,
                    "severity": f.severity,
                    "explanation": f.explanation,
                    "evidence_references": f.evidence_references.split(",") if f.evidence_references else [],
                }
                for f in scan.findings
            ]

            trackers = [
                {
                    "tracker_name": e.tracker_owner or e.destination_domain,
                    "destination_domain": e.destination_domain,
                    "category": e.tracker_category,
                    "owner": e.tracker_owner,
                    "parent_company": e.tracker_owner,
                }
                for e in scan.events
                if e.tracker_match
            ]

    elif req.domain:
        website = db.query(Website).filter(Website.domain == req.domain).first()
        if website:
            latest_scan = (
                db.query(Scan)
                .filter(Scan.website_id == website.id)
                .order_by(Scan.created_at.desc())
                .first()
            )
            if latest_scan:
                score = {
                    "overall_privacy_score": latest_scan.overall_score,
                    "risk_score": latest_scan.risk_score,
                    "tracking_exposure": latest_scan.t_score,
                    "cookie_exposure": latest_scan.c_score,
                    "permission_exposure": latest_scan.p_score,
                    "disclosure_concerns": latest_scan.d_score,
                    "grade": latest_scan.grade,
                }
                findings = [
                    {
                        "id": f.id,
                        "title": f.title,
                        "severity": f.severity,
                        "explanation": f.explanation,
                        "evidence_references": f.evidence_references.split(",") if f.evidence_references else [],
                    }
                    for f in latest_scan.findings
                ]
                trackers = [
                    {
                        "tracker_name": e.tracker_owner or e.destination_domain,
                        "destination_domain": e.destination_domain,
                        "category": e.tracker_category,
                        "owner": e.tracker_owner,
                        "parent_company": e.tracker_owner,
                    }
                    for e in latest_scan.events
                    if e.tracker_match
                ]

    return privacy_copilot.answer_query(
        question=req.question,
        domain=domain,
        findings=findings,
        trackers=trackers,
        cookies=cookies,
        score=score,
    )

