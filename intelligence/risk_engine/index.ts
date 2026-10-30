/**
 * PRIVACYLENS — Deterministic & Explainable Risk Engine
 * Implements R = 0.35T + 0.25C + 0.15P + 0.25D
 * and generates grounded evidence-backed findings.
 */

import {
  CookieObservation,
  DEFAULT_RISK_WEIGHTS,
  EvidenceEvent,
  PermissionObservation,
  PolicyClaim,
  RealityGapFinding,
  RiskScore,
  RiskScoreWeights,
  StorageObservation,
  calculateRiskScore,
} from '../../packages/shared/src';

export interface AssessmentInput {
  site: string;
  events: EvidenceEvent[];
  cookies: CookieObservation[];
  storage: StorageObservation[];
  permissions: PermissionObservation[];
  policyClaims: PolicyClaim[];
  policyDiscovered: boolean;
}

export interface AssessmentResult {
  score: RiskScore;
  findings: RealityGapFinding[];
  summary: {
    totalThirdPartyRequests: number;
    knownTrackersCount: number;
    categoriesDetected: Record<string, number>;
    highRiskTrackers: string[];
    cookiesCount: number;
    thirdPartyCookiesCount: number;
    localStorageKeysCount: number;
  };
}

export class RiskEngine {
  private weights: RiskScoreWeights;

  constructor(weights: RiskScoreWeights = DEFAULT_RISK_WEIGHTS) {
    this.weights = weights;
  }

  public assess(input: AssessmentInput): AssessmentResult {
    const findings: RealityGapFinding[] = [];

    // -------------------------------------------------------------
    // 1. Calculate Tracking Exposure (T)
    // -------------------------------------------------------------
    const thirdPartyEvents = input.events.filter((e) => e.isThirdParty);
    const matchedTrackers = input.events.filter((e) => e.trackerMatch);
    const uniqueTrackers = new Map<string, EvidenceEvent>();
    const categoriesDetected: Record<string, number> = {};
    const highRiskTrackers: string[] = [];

    for (const evt of matchedTrackers) {
      const name = evt.trackerOwner || evt.destinationDomain;
      if (!uniqueTrackers.has(name)) {
        uniqueTrackers.set(name, evt);
      }
      categoriesDetected[evt.trackerCategory] = (categoriesDetected[evt.trackerCategory] || 0) + 1;

      if (evt.trackerCategory === 'fingerprinting' && !highRiskTrackers.includes(name)) {
        highRiskTrackers.push(name);
      }
    }

    let rawT = 0;
    // Each unique tracker adds points based on category severity
    for (const [, evt] of uniqueTrackers) {
      if (evt.trackerCategory === 'fingerprinting') {
        rawT += 35;
        findings.push({
          id: `finding-t-fp-${evt.destinationDomain}`,
          category: 'fingerprinting',
          title: `Browser Fingerprinting / Session Recording Detected (${evt.trackerOwner || evt.destinationDomain})`,
          observedBehavior: `Observed communication with ${evt.destinationDomain} known for session playback, DOM tracking, or client fingerprinting.`,
          policyClaim: 'Requires clear, explicit prior consent under GDPR/ePrivacy.',
          status: 'potentially_inconsistent',
          severity: 'high',
          evidenceReferences: [evt.id, evt.destinationDomain],
          explanation: `Communication with ${evt.destinationDomain} can record granular user interaction, keystrokes, and hardware metrics.`,
        });
      } else if (evt.trackerCategory === 'advertising') {
        rawT += 18;
      } else if (evt.trackerCategory === 'analytics') {
        rawT += 8;
      } else if (evt.trackerCategory === 'social') {
        rawT += 12;
      } else {
        rawT += 5;
      }
    }

    // Additional generic third-party volume exposure
    if (thirdPartyEvents.length > 25) rawT += 15;
    else if (thirdPartyEvents.length > 10) rawT += 8;

    const T = Math.min(100, rawT);

    if (uniqueTrackers.size >= 5) {
      findings.push({
        id: 'finding-t-volume',
        category: 'tracker_volume',
        title: `High Third-Party Tracker Density (${uniqueTrackers.size} services)`,
        observedBehavior: `Connected to ${uniqueTrackers.size} distinct tracking services across ${thirdPartyEvents.length} network requests.`,
        policyClaim: 'May aggregate cross-site profiles across multiple independent ad networks.',
        status: 'consistent',
        severity: 'medium',
        evidenceReferences: Array.from(uniqueTrackers.values()).map((e) => e.destinationDomain),
        explanation: 'Multiple concurrent tracking services increase the surface area for cross-site behavioral correlation.',
      });
    }

    // -------------------------------------------------------------
    // 2. Calculate Cookie & Storage Exposure (C)
    // -------------------------------------------------------------
    let rawC = 0;
    const thirdPartyCookies = input.cookies.filter((c) => c.isThirdParty);
    const longLivedCookies = input.cookies.filter(
      (c) => !c.isSession && (c.expirationDays ?? 0) > 180
    );

    rawC += thirdPartyCookies.length * 15;
    rawC += longLivedCookies.length * 8;

    // Insecure cookies check
    const insecureCookies = input.cookies.filter((c) => !c.isSecure);
    if (insecureCookies.length > 0) {
      rawC += Math.min(25, insecureCookies.length * 5);
      findings.push({
        id: 'finding-c-insecure',
        category: 'cookie_security',
        title: `${insecureCookies.length} Insecure (Non-SSL) Cookie(s) Set`,
        observedBehavior: `Cookies ${insecureCookies.slice(0, 3).map((c) => c.name).join(', ')} lack the Secure flag.`,
        policyClaim: 'Data in transit should be encrypted under modern web security standards.',
        status: 'potentially_inconsistent',
        severity: 'medium',
        evidenceReferences: insecureCookies.map((c) => c.name),
        explanation: 'Cookies without the Secure flag can be intercepted if any request on the domain is transmitted in plain HTTP.',
      });
    }

    // High entropy storage keys
    const highEntropyStorage = input.storage.filter((s) => s.hasHighEntropyIdentifier);
    if (highEntropyStorage.length > 0) {
      rawC += Math.min(30, highEntropyStorage.length * 10);
      findings.push({
        id: 'finding-s-identifier',
        category: 'local_storage',
        title: `Persistent Client-Side Tracking Identifier(s) in LocalStorage`,
        observedBehavior: `Discovered keys [${highEntropyStorage.slice(0, 3).map((s) => s.key).join(', ')}] with high-entropy unique identifier patterns.`,
        policyClaim: 'Should be cleared when cookies/trackers are opted out.',
        status: 'consistent',
        severity: 'medium',
        evidenceReferences: highEntropyStorage.map((s) => s.key),
        explanation: 'Local storage tokens often survive standard cookie clear operations and are used as backup fingerprint sync identifiers.',
      });
    }

    const C = Math.min(100, rawC);

    // -------------------------------------------------------------
    // 3. Calculate Permission Exposure (P)
    // -------------------------------------------------------------
    let rawP = 0;
    for (const perm of input.permissions) {
      if (perm.state === 'granted') {
        if (perm.name === 'geolocation') {
          rawP += 45;
          findings.push({
            id: 'finding-p-geo',
            category: 'permissions',
            title: 'Precise Geolocation Access Granted',
            observedBehavior: 'Website has permission to retrieve exact GPS/device coordinates.',
            policyClaim: 'Location data should be minimized to coarse city level unless strictly necessary.',
            status: 'potentially_inconsistent',
            severity: 'high',
            evidenceReferences: ['geolocation'],
            explanation: 'Location data is high-risk personal data that reveals physical habits, home, and work routines.',
          });
        } else if (perm.name === 'camera' || perm.name === 'microphone') {
          rawP += 60;
        } else if (perm.name === 'notifications') {
          rawP += 20;
        }
      }
    }
    const P = Math.min(100, rawP);

    // -------------------------------------------------------------
    // 4. Calculate Disclosure & Policy Transparency (D)
    // -------------------------------------------------------------
    let rawD = 0;
    if (!input.policyDiscovered) {
      rawD += 40;
      findings.push({
        id: 'finding-d-missing',
        category: 'policy_transparency',
        title: 'No Accessible Privacy Policy Discovered',
        observedBehavior: 'Automated policy discovery did not identify a clear privacy policy URL in standard DOM elements.',
        policyClaim: 'Websites must provide prominent, accessible privacy disclosures.',
        status: 'potentially_inconsistent',
        severity: 'high',
        evidenceReferences: [input.site],
        explanation: 'Without a published privacy policy, data collection practices cannot be legally verified.',
      });
    } else {
      // Check Privacy Reality Gap:
      // Does observed behavior contradict or exceed extracted claims?
      const adTrackersObserved = input.events.filter(
        (e) => e.trackerMatch && e.trackerCategory === 'advertising'
      );
      const policyMentionsThirdPartyAds = input.policyClaims.some(
        (c) =>
          c.category === 'third_party_sharing' ||
          c.category === 'advertising_targeting' ||
          c.claimText.toLowerCase().includes('advertising') ||
          c.claimText.toLowerCase().includes('partner')
      );

      if (adTrackersObserved.length > 0 && !policyMentionsThirdPartyAds) {
        rawD += 35;
        findings.push({
          id: 'finding-d-gap-ads',
          category: 'reality_gap',
          title: 'Undisclosed Third-Party Advertising Trackers Detected',
          observedBehavior: `Detected ${adTrackersObserved.length} advertising trackers (${adTrackersObserved.slice(0, 3).map((e) => e.destinationDomain).join(', ')}).`,
          policyClaim: 'Policy text does not explicitly disclose third-party advertising or retargeting partners.',
          status: 'potentially_inconsistent',
          severity: 'high',
          evidenceReferences: adTrackersObserved.map((e) => e.destinationDomain),
          explanation: 'Behavioral retargeting trackers are actively communicating, but extracted policy claims do not disclose ad partner sharing.',
        });
      }

      // Check data sale claims
      const dataSaleClaim = input.policyClaims.find((c) => c.category === 'data_sale');
      if (dataSaleClaim && dataSaleClaim.claimText.toLowerCase().includes('we may sell')) {
        rawD += 30;
        findings.push({
          id: 'finding-d-sale',
          category: 'data_sale',
          title: 'Policy Discloses Potential Sale/Sharing of Personal Data',
          observedBehavior: 'Policy explicitly reserves the right to transfer or share data for commercial consideration.',
          policyClaim: dataSaleClaim.claimText,
          status: 'consistent',
          severity: 'high',
          evidenceReferences: [dataSaleClaim.id],
          explanation: 'Users subject to CCPA/CPRA should exercise "Do Not Sell or Share My Personal Information" rights.',
        });
      }
    }

    const D = Math.min(100, rawD);

    // Compute composite explainable score
    const score = calculateRiskScore(T, C, P, D, this.weights);

    return {
      score,
      findings,
      summary: {
        totalThirdPartyRequests: thirdPartyEvents.length,
        knownTrackersCount: uniqueTrackers.size,
        categoriesDetected,
        highRiskTrackers,
        cookiesCount: input.cookies.length,
        thirdPartyCookiesCount: thirdPartyCookies.length,
        localStorageKeysCount: input.storage.length,
      },
    };
  }
}

export const defaultRiskEngine = new RiskEngine();
