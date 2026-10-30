from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from ..schemas.schemas import PolicyClaimSchema
from ..services.policy_analyzer import policy_analyzer

router = APIRouter(prefix="/api/v1/policy", tags=["policy"])

class PolicyAnalysisRequest(BaseModel):
    url: str
    text: str

class PolicyAnalysisResponse(BaseModel):
    claims: List[PolicyClaimSchema]
    total_claims: int

@router.post("/analyze", response_model=PolicyAnalysisResponse)
def analyze_policy(req: PolicyAnalysisRequest):
    claims = policy_analyzer.analyze_text(req.text)
    return PolicyAnalysisResponse(
        claims=claims,
        total_claims=len(claims),
    )
