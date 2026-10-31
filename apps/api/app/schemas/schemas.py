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

# -------------------------------------------------------------
# Gemma 4 (Policy Intelligence) + Zeek (Independent Traffic Auditor)
# -------------------------------------------------------------
class GemmaExtractedClaim(BaseModel):
    id: str
    category: str # "data_collection" | "third_party_sharing" | "advertising_targeting" | "data_retention" | "user_rights" | "data_sale"
    claim_text: str
    legal_implication: str # Gemma 4 plain-English translation
    entities_disclosed: List[str] = []
    source_excerpt: str # Verbatim quote from policy
    confidence: float = 0.9
    is_explicit: bool = True

class GemmaExtractionResult(BaseModel):
    model: str = "Gemma 4"
    policy_domain: str
    claims: List[GemmaExtractedClaim]
    total_claims: int
    executive_summary: str

class ZeekEvidenceRecord(BaseModel):
    ts: Optional[str] = None
    uid: str
    proto: str = "http" # "http" | "ssl" | "dns"
    host: str
    uri: Optional[str] = None
    method: Optional[str] = None
    is_tracker: bool = False
    tracker_name: Optional[str] = None
    tracker_category: Optional[str] = None
    is_screen_recorder: bool = False
    is_cname_cloaked: bool = False
    cname_target: Optional[str] = None
    audit_note: Optional[str] = None

class ZeekDiscrepancy(BaseModel):
    id: str
    policy_claim_text: str
    zeek_wire_evidence: str
    discrepancy_type: str # "undisclosed_screen_recorder" | "undisclosed_ad_retargeting" | "policy_contradiction" | "unencrypted_pii" | "cname_cloaking"
    severity: str # "low" | "medium" | "high" | "critical"
    explanation: str

class ZeekAuditReport(BaseModel):
    auditor: str = "Zeek Network Security Monitor v6.x"
    total_packets_audited: int
    trackers_detected_on_wire: List[str]
    screen_recorders_detected: List[str]
    discrepancies: List[ZeekDiscrepancy]
    network_trust_score: float # 0.0 - 1.0 (Based on wire adherence to policy)
    human_review_required: bool
    wire_verdict: str # "CLEAN_CONFORMANT" | "DISCREPANCIES_DETECTED" | "SUSPICIOUS_BEACONS_DETECTED"

class PolicyZeekAuditResponse(BaseModel):
    domain: str
    status: str # "wire_verified" | "discrepancies_detected" | "manual_review_required"
    gemma_extraction: GemmaExtractionResult
    zeek_audit: ZeekAuditReport
    consensus_score: float
    summary: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# =========================================================================
# Spatio-Temporal Graph Neural Network (STGNN) Schemas
# =========================================================================
class STGNNNode(BaseModel):
    id: str
    domain: str
    node_type: str # "first_party" | "third_party" | "ad_exchange" | "screen_recorder" | "storage_sink"
    in_degree: int = 0
    out_degree: int = 0
    centrality_score: float = 0.0

class STGNNEdge(BaseModel):
    source: str
    target: str
    relation: str # "script_inject" | "xhr_beacon" | "cookie_sync" | "iframe_embed" | "cname_hop"
    timestamp: float # Unix epoch seconds
    time_window: int # Discrete temporal slice (0 .. T-1)
    weight: float = 1.0

class STGNNPrediction(BaseModel):
    domain: str
    tracker_probability: float # 0.0 to 1.0
    classification: str # "first_party" | "screen_recording" | "ad_retargeting" | "fingerprinting" | "benign_cdn"
    is_evasive: bool = False
    temporal_burst_rate: float = 0.0 # requests / sec in peak window
    risk_contribution: float = 0.0

class STGNNGraphReport(BaseModel):
    model: str = "PRIVACYLENS STGNN (Spatio-Temporal GNN v1.0)"
    domain: str
    total_nodes: int
    total_edges: int
    temporal_slices: int
    graph_density: float
    critical_leakage_path: List[str]
    predictions: List[STGNNPrediction]
    spatio_temporal_risk_score: float # 0 to 100
    risk_level: str # "Minimal" | "Moderate" | "Elevated" | "Severe"
    summary: str
    analyzed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())



