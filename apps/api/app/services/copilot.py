from typing import List, Dict, Any, Optional
from ..schemas.schemas import CopilotQueryResponse, ScanResponse, RealityGapFindingSchema

class PrivacyCopilot:
    """
    Evidence-grounded privacy copilot that answers user questions
    by referencing observed network telemetry, cookies, and policy claims.
    """

    def answer_query(
        self,
        question: str,
        domain: str,
        findings: List[Dict[str, Any]],
        trackers: List[Dict[str, Any]],
        cookies: List[Dict[str, Any]],
        score: Dict[str, Any],
    ) -> CopilotQueryResponse:
        q_lower = question.lower()
        citations: List[Dict[str, Any]] = []

        # 1. Inquiries about score or why the site is considered risky
        if "risk" in q_lower or "score" in q_lower or "why" in q_lower or "grade" in q_lower:
            high_sev = [f for f in findings if f.get("severity") in ["high", "critical"]]
            reasons = []

            for f in high_sev[:3]:
                reasons.append(f"- **{f.get('title')}**: {f.get('explanation')}")
                citations.append({
                    "type": "risk_finding",
                    "id": f.get("id"),
                    "title": f.get("title"),
                    "evidence": f.get("evidence_references"),
                })

            t_val = score.get("tracking_exposure", 0)
            c_val = score.get("cookie_exposure", 0)
            d_val = score.get("disclosure_concerns", 0)
            privacy_val = score.get("overall_privacy_score", 0)

            ans = (
                f"### Privacy Assessment for `{domain}`\n\n"
                f"PRIVACYLENS evaluated this site with an overall Privacy Score of **{privacy_val}/100** (Grade **{score.get('grade')}**).\n\n"
                f"**Key Risk Drivers:**\n"
                f"- **Tracking Exposure (T)**: {t_val}/100 (Detected {len(trackers)} tracker entities)\n"
                f"- **Cookie Exposure (C)**: {c_val}/100 ({len(cookies)} total cookies observed)\n"
                f"- **Disclosure & Policy Concerns (D)**: {d_val}/100\n\n"
                f"**Critical Evidence-Backed Findings:**\n"
                + ("\n".join(reasons) if reasons else "No critical risk flags observed in this session.")
                + "\n\n*Note: Observed trackers do not legally prove misuse or sale of data, but indicate substantial cross-site observation exposure.*"
            )

            return CopilotQueryResponse(
                answer=ans,
                citations=citations,
                confidence=0.96,
                requires_further_evidence=False,
            )

        # 2. Inquiries about advertising or Facebook/Google tracking
        if "ad" in q_lower or "facebook" in q_lower or "google" in q_lower or "pixel" in q_lower:
            ad_trackers = [
                t for t in trackers
                if t.get("category") == "advertising"
                or "facebook" in str(t.get("owner", "")).lower()
                or "google" in str(t.get("owner", "")).lower()
            ]

            if ad_trackers:
                tracker_lines = [
                    f"- **{t.get('tracker_name', t.get('name', 'Unknown'))}** (Owner: `{t.get('parent_company', t.get('owner', 'Unknown'))}`): Communicating via `{t.get('domain', t.get('destination_domain', ''))}`"
                    for t in ad_trackers[:5]
                ]
                for t in ad_trackers[:5]:
                    citations.append({
                        "type": "tracker_match",
                        "entity": t.get("tracker_name"),
                        "domain": t.get("destination_domain") or t.get("domain"),
                    })

                ans = (
                    f"### Advertising & Retargeting Telemetry on `{domain}`\n\n"
                    f"PRIVACYLENS detected **{len(ad_trackers)}** advertising tracker(s) on this website:\n\n"
                    + "\n".join(tracker_lines)
                    + "\n\nThese scripts synchronize identifiers to build cross-site interest profiles and monitor conversions."
                )
                return CopilotQueryResponse(
                    answer=ans,
                    citations=citations,
                    confidence=0.94,
                    requires_further_evidence=False,
                )
            else:
                return CopilotQueryResponse(
                    answer=f"Based on real network telemetry captured for `{domain}`, no direct Facebook, Google Ads, or advertising tracker requests were observed.",
                    citations=[],
                    confidence=0.90,
                    requires_further_evidence=False,
                )

        # 3. Inquiries about session recording / fingerprinting / keystrokes
        if "keystroke" in q_lower or "fingerprint" in q_lower or "record" in q_lower or "clarity" in q_lower or "hotjar" in q_lower:
            fp_trackers = [t for t in trackers if t.get("category") == "fingerprinting"]
            if fp_trackers:
                names = [t.get("tracker_name", t.get("name", "Unknown")) for t in fp_trackers]
                for t in fp_trackers:
                    citations.append({
                        "type": "fingerprinting_tracker",
                        "name": t.get("tracker_name"),
                    })
                ans = (
                    f"### Session Recording & Fingerprinting Alert\n\n"
                    f"Yes. Network observation captured active connections to **{', '.join(names)}**.\n\n"
                    f"These technologies capture mouse trajectories, click coordinates, scrolling patterns, and DOM layout snapshots. In high-risk configurations, they may intercept form entries."
                )
                return CopilotQueryResponse(
                    answer=ans,
                    citations=citations,
                    confidence=0.95,
                    requires_further_evidence=False,
                )
            else:
                return CopilotQueryResponse(
                    answer=f"No active session recording (e.g. Hotjar, Microsoft Clarity, FullStory) or canvas fingerprinting domains were captured during this inspection of `{domain}`.",
                    citations=[],
                    confidence=0.88,
                    requires_further_evidence=False,
                )

        # 4. Default evidence-grounded response
        return CopilotQueryResponse(
            answer=(
                f"### Evidence Summary for `{domain}`\n\n"
                f"PRIVACYLENS recorded **{len(trackers)}** trackers, **{len(cookies)}** cookies, and **{len(findings)}** risk findings for this site.\n\n"
                f"Your query *\"{question}\"* asks about details beyond direct deterministic network traces. "
                f"PRIVACYLENS does not inspect private payload bodies or speculate without observable evidence."
            ),
            citations=[],
            confidence=0.75,
            requires_further_evidence=True,
        )

privacy_copilot = PrivacyCopilot()
