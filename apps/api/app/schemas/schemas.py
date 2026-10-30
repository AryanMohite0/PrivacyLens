from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TrackerMatch(BaseModel):
    matched: bool
    tracker_name: Optional[str] = None
    category: str
    owner: Optional[str] = None
    parent_company: Optional[str] = None
    source: str
    confidence: float

class EvidenceEventSchema(BaseModel):
    id: str
    scan_id: Optional[str] = None
    site: str
    site_root_domain: Optional[str] = None
    event_type: str = "third_party_request"
    destination: str
    destination_domain: str
    destination_root_domain: Optional[str] = None
    is_third_party: bool = True
    resource_type: str = "other"
    tracker_match: bool = False
    tracker_category: str = "unknown"
    tracker_owner: Optional[str] = None
    source: str = "local_browser_observation"
    confidence: float = 1.0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Optional[Dict[str, Any]] = None

class CookieObservationSchema(BaseModel):
    name: str
    domain: str
    path: str = "/"
    is_secure: bool = False
    is_httponly: bool = False
    samesite: str = "unspecified"
    is_session: bool = False
    expiration_days: Optional[int] = None
    category: str = "functional"
    is_third_party: bool = False

class StorageObservationSchema(BaseModel):
    type: str = "localStorage"
    key: str
    byte_size_estimate: int = 0
    has_high_entropy_identifier: bool = False

class PermissionObservationSchema(BaseModel):
    name: str
    state: str = "prompt"
    risk_level: str = "medium"

class PolicyClaimSchema(BaseModel):
    id: str
    category: str
    claim_text: str
    entities_disclosed: List[str] = []
    source_excerpt: str
    confidence: float = 0.9
    is_explicit: bool = True

class RealityGapFindingSchema(BaseModel):
    id: str
    category: str
    title: str
    observed_behavior: str
    policy_claim: str
    status: str # "consistent" | "potentially_inconsistent" | "unverifiable"
    severity: str # "low" | "medium" | "high" | "critical"
    evidence_references: List[str]
    explanation: str

class RiskScoreSchema(BaseModel):
    overall_privacy_score: float # 100 - R
    risk_score: float # R
    tracking_exposure: float # T
    cookie_exposure: float # C
    permission_exposure: float # P
    disclosure_concerns: float # D
    grade: str # A, B, C, D, F
    calculated_at: str

class ScanCreateRequest(BaseModel):
    url: str
    events: List[EvidenceEventSchema] = []
    cookies: List[CookieObservationSchema] = []
    storage: List[StorageObservationSchema] = []
    permissions: List[PermissionObservationSchema] = []
    policy_claims: List[PolicyClaimSchema] = []

class ScanResponse(BaseModel):
    id: str
    url: str
    domain: str
    root_domain: str
    created_at: str
    score: RiskScoreSchema
    findings: List[RealityGapFindingSchema]
    total_events: int
    trackers_count: int
    cookies_count: int

class CopilotQueryRequest(BaseModel):
    scan_id: Optional[str] = None
    domain: Optional[str] = None
    question: str

class CopilotQueryResponse(BaseModel):
    answer: str
    citations: List[Dict[str, Any]]
    confidence: float
    requires_further_evidence: bool
