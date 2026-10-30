import re
import uuid
from typing import List, Dict, Any
from ..schemas.schemas import PolicyClaimSchema

class PolicyAnalyzer:
    """
    Extracts structured policy claims from privacy policy text.
    Combines deterministic regex/keyword boundaries with structured claim extraction.
    """

    PATTERNS = {
        "third_party_sharing": [
            r"(?:we|our)\s+(?:share|disclose|transfer)\s+(?:your\s+)?(?:personal\s+)?(?:information|data)\s+with\s+([^.]+)",
            r"(?:third-party|third\s+party)\s+(?:partners|service\s+providers|vendors|affiliates)\s+may\s+(?:receive|access)\s+([^.]+)",
        ],
        "advertising_targeting": [
            r"(?:tailored|targeted|interest-based|behavioral)\s+advertising",
            r"(?:we|our\s+partners)\s+use\s+cookies\s+(?:and\s+similar\s+technologies\s+)?to\s+serve\s+ads",
            r"cross-context\s+behavioral\s+advertising",
        ],
        "data_sale": [
            r"we\s+do\s+not\s+sell\s+your\s+personal\s+(?:information|data)",
            r"we\s+may\s+sell\s+(?:or\s+share\s+)?your\s+personal\s+(?:information|data)",
            r"under\s+(?:the\s+)?CCPA(?:/CPRA)?,\s+you\s+have\s+the\s+right\s+to\s+opt-out\s+of\s+the\s+sale",
        ],
        "data_retention": [
            r"(?:retain|keep|store)\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+for\s+([^.]+)",
            r"retention\s+period\s+is\s+([^.]+)",
        ],
        "user_rights": [
            r"(?:right\s+to\s+(?:access|delete|rectify|erase|restrict|object|portability))",
            r"under\s+GDPR,\s+you\s+have\s+the\s+right",
        ],
    }

    def analyze_text(self, text: str) -> List[PolicyClaimSchema]:
        claims: List[PolicyClaimSchema] = []
        clean_text = " ".join(text.split())

        # Check each category
        for category, patterns in self.PATTERNS.items():
            for pat in patterns:
                matches = list(re.finditer(pat, clean_text, re.IGNORECASE))
                for match in matches:
                    excerpt_start = max(0, match.start() - 60)
                    excerpt_end = min(len(clean_text), match.end() + 60)
                    excerpt = clean_text[excerpt_start:excerpt_end].strip()

                    claim_id = f"claim-{category}-{uuid.uuid4().hex[:6]}"
                    claims.append(
                        PolicyClaimSchema(
                            id=claim_id,
                            category=category,
                            claim_text=match.group(0),
                            entities_disclosed=[],
                            source_excerpt=f"...{excerpt}...",
                            confidence=0.88,
                            is_explicit=True,
                        )
                    )

        # Fallback if no specific regex triggered
        if not claims:
            claims.append(
                PolicyClaimSchema(
                    id=f"claim-general-{uuid.uuid4().hex[:6]}",
                    category="data_collection",
                    claim_text="Generic data collection disclosure parsed.",
                    source_excerpt=clean_text[:200] + "..." if len(clean_text) > 200 else clean_text,
                    confidence=0.5,
                    is_explicit=False,
                )
            )

        return claims

policy_analyzer = PolicyAnalyzer()
