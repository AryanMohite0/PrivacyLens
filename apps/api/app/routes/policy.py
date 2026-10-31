from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from ..schemas.schemas import (
    PolicyClaimSchema,
    PolicyZeekAuditResponse,
    EvidenceEventSchema,
    ZeekEvidenceRecord,
    STGNNGraphReport,
)
from ..services.policy_analyzer import policy_analyzer
from ..services.gemma_zeek_engine import gemma_zeek_engine
from ..services.zeek_log_parser import ZeekLogParser
from ..services.stgnn_engine import stgnn_engine

router = APIRouter(prefix="/api/v1/policy", tags=["policy"])

class PolicyAnalysisRequest(BaseModel):
    url: str
    text: str

class PolicyAnalysisResponse(BaseModel):
    claims: List[PolicyClaimSchema]
    total_claims: int

class ZeekAuditRequest(BaseModel):
    domain: str
    policy_text: str
    observed_events: Optional[List[EvidenceEventSchema]] = []
    zeek_records: Optional[List[ZeekEvidenceRecord]] = []

class ZeekRawLogAuditRequest(BaseModel):
    domain: str
    policy_text: str
    raw_zeek_log: str
    format: str = "tsv" # "tsv" or "json"
    dns_log: Optional[str] = None

class STGNNEvalRequest(BaseModel):
    domain: str
    events: List[EvidenceEventSchema]

@router.post("/analyze", response_model=PolicyAnalysisResponse)
def analyze_policy(req: PolicyAnalysisRequest):
    claims = policy_analyzer.analyze_text(req.text)
    return PolicyAnalysisResponse(
        claims=claims,
        total_claims=len(claims),
    )

@router.post("/zeek-audit", response_model=PolicyZeekAuditResponse)
async def audit_policy_with_zeek(req: ZeekAuditRequest):
    """
    Gemma 4 + Zeek Cross-Layer Privacy Audit:
    - Gemma 4 extracts policy commitments, collection/sharing/retention disclosures, and legal implications.
    - Zeek independently audits the physical network wire (deep packet inspection, tracking beacons, TLS SNI).
    - Detects undisclosed screen recorders, hidden ad retargeting, and policy contradictions.
    """
    result = await gemma_zeek_engine.run_pipeline(
        domain=req.domain,
        policy_text=req.policy_text,
        observed_events=req.observed_events or [],
        zeek_records=req.zeek_records or [],
    )
    return result

@router.post("/zeek-logs-audit", response_model=PolicyZeekAuditResponse)
async def audit_raw_zeek_logs(req: ZeekRawLogAuditRequest):
    """
    Ingests raw Zeek TSV or JSON log streams (privacylens_audit.log, conn.log, etc.),
    parses CNAME cloaking from dns.log, and runs the Gemma 4 + Zeek reality gap audit.
    """
    if req.format == "json":
        records = ZeekLogParser.parse_zeek_json_lines(req.raw_zeek_log)
    else:
        records = ZeekLogParser.parse_zeek_tsv(req.raw_zeek_log)

    if req.dns_log:
        cloaked_map = ZeekLogParser.detect_cname_cloaking(req.dns_log)
        for r in records:
            if r.host.lower() in cloaked_map:
                r.is_cname_cloaked = True
                r.cname_target = cloaked_map[r.host.lower()]
                r.is_tracker = True

    result = await gemma_zeek_engine.run_pipeline(
        domain=req.domain,
        policy_text=req.policy_text,
        observed_events=[],
        zeek_records=records,
    )
    return result

@router.post("/stgnn-evaluate", response_model=STGNNGraphReport)
def evaluate_with_stgnn(req: STGNNEvalRequest):
    """
    Spatio-Temporal Graph Neural Network (STGNN) Evaluation:
    Evaluates session network events, builds dynamic graph topology,
    computes spatial convolutions & temporal burst rates, and classifies tracking nodes.
    """
    return stgnn_engine.analyze_session(
        first_party=req.domain,
        events=req.events,
    )
