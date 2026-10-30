import datetime
from typing import List, Dict, Any, Tuple
from ..schemas.schemas import (
    EvidenceEventSchema,
    CookieObservationSchema,
    StorageObservationSchema,
    PermissionObservationSchema,
    PolicyClaimSchema,
    RealityGapFindingSchema,
    RiskScoreSchema,
)

class RiskEngine:
    """
    Explainable Risk Engine adhering strictly to:
    R = 0.35T + 0.25C + 0.15P + 0.25D
    Privacy Score = 100 - R
    """

    def __init__(self, wt: float = 0.35, wc: float = 0.25, wp: float = 0.15, wd: float = 0.25):
        self.wt = wt
        self.wc = wc
        self.wp = wp
        self.wd = wd

    def assess(
        self,
        site: str,
        events: List[EvidenceEventSchema],
        cookies: List[CookieObservationSchema],
        storage: List[StorageObservationSchema],
        permissions: List[PermissionObservationSchema],
        policy_claims: List[PolicyClaimSchema],
        policy_discovered: bool = True,
    ) -> Tuple[RiskScoreSchema, List[RealityGapFindingSchema]]:
        findings: List[RealityGapFindingSchema] = []

        # 1. Tracking Exposure (T)
        third_party_events = [e for e in events if e.is_third_party]
        matched_trackers = [e for e in events if e.tracker_match]
        unique_trackers: Dict[str, EvidenceEventSchema] = {}
        high_risk_trackers = []

        for e in matched_trackers:
            key = e.tracker_owner or e.destination_domain
            if key not in unique_trackers:
                unique_trackers[key] = e
            if e.tracker_category == "fingerprinting" and key not in high_risk_trackers:
                high_risk_trackers.append(key)

        raw_t = 0.0
        for key, e in unique_trackers.items():
            if e.tracker_category == "fingerprinting":
                raw_t += 35.0
                findings.append(
                    RealityGapFindingSchema(
                        id=f"gap-fp-{e.destination_domain}",
                        category="fingerprinting",
                        title=f"Session Recording / Fingerprinting Script ({key})",
                        observed_behavior=f"Active connection to {e.destination_domain} capable of DOM recording and device fingerprinting.",
                        policy_claim="Requires explicit affirmative prior consent under ePrivacy / GDPR.",
                        status="potentially_inconsistent",
                        severity="high",
                        evidence_references=[e.id, e.destination_domain],
                        explanation=f"Connection to {e.destination_domain} can monitor keystrokes, mouse trails, and hardware canvas signatures.",
                    )
                )
            elif e.tracker_category == "advertising":
                raw_t += 18.0
            elif e.tracker_category == "social":
                raw_t += 12.0
            elif e.tracker_category == "analytics":
                raw_t += 8.0
            else:
                raw_t += 5.0

        if len(third_party_events) > 25:
            raw_t += 15.0
        elif len(third_party_events) > 10:
            raw_t += 8.0

        t = min(100.0, raw_t)

        # 2. Cookie & Storage Exposure (C)
        raw_c = 0.0
        third_party_cookies = [c for c in cookies if c.is_third_party]
        insecure_cookies = [c for c in cookies if not c.is_secure]
        long_lived_cookies = [c for c in cookies if not c.is_session and (c.expiration_days or 0) > 180]

        raw_c += len(third_party_cookies) * 15.0
        raw_c += len(long_lived_cookies) * 8.0

        if insecure_cookies:
            raw_c += min(25.0, len(insecure_cookies) * 5.0)
            findings.append(
                RealityGapFindingSchema(
                    id="gap-c-insecure",
                    category="cookie_security",
                    title=f"{len(insecure_cookies)} Insecure Cookie(s) Set",
                    observed_behavior=f"Cookies {[c.name for c in insecure_cookies[:3]]} lack the Secure attribute.",
                    policy_claim="Transmission over encrypted HTTPS only.",
                    status="potentially_inconsistent",
                    severity="medium",
                    evidence_references=[c.name for c in insecure_cookies],
                    explanation="Cookies without the Secure attribute risk leakage over non-TLS cleartext requests.",
                )
            )

        high_entropy_storage = [s for s in storage if s.has_high_entropy_identifier]
        if high_entropy_storage:
            raw_c += min(30.0, len(high_entropy_storage) * 10.0)
            findings.append(
                RealityGapFindingSchema(
                    id="gap-s-identifier",
                    category="local_storage",
                    title="Persistent LocalStorage Tracking Key(s)",
                    observed_behavior=f"Identified high-entropy storage tokens: {[s.key for s in high_entropy_storage[:3]]}.",
                    policy_claim="Must be subject to user cookie/storage consent preferences.",
                    status="consistent",
                    severity="medium",
                    evidence_references=[s.key for s in high_entropy_storage],
                    explanation="LocalStorage tokens are persistent across sessions and often bypass regular cookie clearing.",
                )
            )

        c = min(100.0, raw_c)

        # 3. Permission Exposure (P)
        raw_p = 0.0
        for perm in permissions:
            if perm.state == "granted":
                if perm.name in ["geolocation"]:
                    raw_p += 45.0
                    findings.append(
                        RealityGapFindingSchema(
                            id="gap-p-geo",
                            category="permissions",
                            title="Precise Geolocation Access Granted",
                            observed_behavior="Site holds active browser permission for high-accuracy GPS coordinates.",
                            policy_claim="Location collection requires proportionality and purpose specification.",
                            status="potentially_inconsistent",
                            severity="high",
                            evidence_references=["geolocation"],
                            explanation="Precise geolocation reveals real-time physical routines and sensitive locations.",
                        )
                    )
                elif perm.name in ["camera", "microphone"]:
                    raw_p += 60.0
                elif perm.name in ["notifications"]:
                    raw_p += 20.0
        p = min(100.0, raw_p)

        # 4. Disclosure & Transparency Concerns (D)
        raw_d = 0.0
        if not policy_discovered:
            raw_d += 40.0
            findings.append(
                RealityGapFindingSchema(
                    id="gap-d-none",
                    category="policy_transparency",
                    title="No Verifiable Privacy Policy Available",
                    observed_behavior="No privacy disclosure URL identified on the domain.",
                    policy_claim="A clear, publicly accessible privacy notice is legally mandatory.",
                    status="potentially_inconsistent",
                    severity="high",
                    evidence_references=[site],
                    explanation="Absence of a public privacy policy prevents verification of data collection boundaries.",
                )
            )
        else:
            # Check Reality Gap: advertising trackers active vs policy disclosure
            ad_trackers = [e for e in matched_trackers if e.tracker_category == "advertising"]
            has_ad_disclosure = any(
                claim.category in ["advertising_targeting", "third_party_sharing"] or "advertis" in claim.claim_text.lower()
                for claim in policy_claims
            )

            if ad_trackers and not has_ad_disclosure:
                raw_d += 35.0
                findings.append(
                    RealityGapFindingSchema(
                        id="gap-d-ads",
                        category="reality_gap",
                        title="Undisclosed Third-Party Advertising Trackers",
                        observed_behavior=f"Detected {len(ad_trackers)} ad trackers ({', '.join([e.destination_domain for e in ad_trackers[:3]])}).",
                        policy_claim="Current policy claims make no explicit mention of third-party advertising partners.",
                        status="potentially_inconsistent",
                        severity="high",
                        evidence_references=[e.destination_domain for e in ad_trackers],
                        explanation="Discrepancy detected between observed ad beacon activity and published policy claims.",
                    )
                )

        d = min(100.0, raw_d)

        # Composite score
        risk_score = round(self.wt * t + self.wc * c + self.wp * p + self.wd * d, 1)
        risk_score = max(0.0, min(100.0, risk_score))
        overall_score = round(100.0 - risk_score, 1)

        grade = "F"
        if overall_score >= 85:
            grade = "A"
        elif overall_score >= 70:
            grade = "B"
        elif overall_score >= 55:
            grade = "C"
        elif overall_score >= 40:
            grade = "D"

        score = RiskScoreSchema(
            overall_privacy_score=overall_score,
            risk_score=risk_score,
            tracking_exposure=t,
            cookie_exposure=c,
            permission_exposure=p,
            disclosure_concerns=d,
            grade=grade,
            calculated_at=datetime.datetime.utcnow().isoformat(),
        )

        return score, findings
