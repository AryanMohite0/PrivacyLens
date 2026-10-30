/**
 * PRIVACYLENS — Shared Data Models & Deterministic Types
 * Strictly typed contracts for Extension, Backend, Dashboard, and Intelligence Engine.
 */

export type TrackerCategory =
  | 'advertising'
  | 'analytics'
  | 'fingerprinting'
  | 'social'
  | 'customer_interaction'
  | 'content_cdn'
  | 'unknown';

export type EventType =
  | 'third_party_request'
  | 'cookie_set'
  | 'storage_access'
  | 'permission_requested'
  | 'script_loaded';

export interface TrackerMatch {
  matched: boolean;
  trackerName?: string;
  category: TrackerCategory;
  owner?: string;
  parentCompany?: string;
  source: 'disconnect' | 'easyprivacy' | 'privacylens_curated' | 'heuristic' | 'none';
  confidence: number;
}

export interface EvidenceEvent {
  id: string;
  scanId: string;
  site: string; // e.g. "store.nike.com"
  siteRootDomain: string; // e.g. "nike.com"
  eventType: EventType;
  destination: string; // Sanitized URL or host, query strings removed/cleansed
  destinationDomain: string; // e.g. "adservice.google.com"
  destinationRootDomain: string; // e.g. "google.com"
  isThirdParty: boolean;
  resourceType: string; // e.g. 'script', 'xmlhttprequest', 'image', 'fetch', 'sub_frame'
  trackerMatch: boolean;
  trackerCategory: TrackerCategory;
  trackerOwner?: string;
  source: 'local_browser_observation' | 'content_script' | 'synthetic_test';
  confidence: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CookieObservation {
  name: string;
  domain: string;
  path: string;
  isSecure: boolean;
  isHttpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'no_restriction' | 'unspecified';
  isSession: boolean;
  expirationDays?: number;
  category: 'functional' | 'analytics' | 'advertising' | 'unknown';
  isThirdParty: boolean;
  retrievedAt: string;
}

export interface StorageObservation {
  type: 'localStorage' | 'sessionStorage';
  key: string;
  byteSizeEstimate: number;
  hasHighEntropyIdentifier: boolean;
}

export interface PermissionObservation {
  name: string; // e.g. "geolocation", "notifications", "camera"
  state: 'granted' | 'denied' | 'prompt';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PolicyClaim {
  id: string;
  category:
    | 'data_collection'
    | 'third_party_sharing'
    | 'advertising_targeting'
    | 'data_retention'
    | 'user_rights'
    | 'data_sale';
  claimText: string;
  entitiesDisclosed: string[];
  sourceExcerpt: string;
  sectionHeading?: string;
  confidence: number;
  isExplicit: boolean;
}

export type RealityGapStatus =
  | 'consistent'
  | 'potentially_inconsistent'
  | 'unverifiable';

export interface RealityGapFinding {
  id: string;
  category: string;
  title: string;
  observedBehavior: string;
  policyClaim: string;
  status: RealityGapStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidenceReferences: string[]; // event IDs or domain names
  explanation: string;
}

export interface RiskScoreWeights {
  T: number; // Tracking exposure weight (default 0.35)
  C: number; // Cookie & storage exposure weight (default 0.25)
  P: number; // Permission exposure weight (default 0.15)
  D: number; // Disclosure & policy transparency concerns weight (default 0.25)
}

export const DEFAULT_RISK_WEIGHTS: RiskScoreWeights = {
  T: 0.35,
  C: 0.25,
  P: 0.15,
  D: 0.25,
};

export interface RiskScore {
  overallPrivacyScore: number; // 100 - R (0 to 100, higher is better privacy)
  riskScore: number; // R (0 to 100, higher is more risk)
  trackingExposure: number; // T (0 to 100)
  cookieExposure: number; // C (0 to 100)
  permissionExposure: number; // P (0 to 100)
  disclosureConcerns: number; // D (0 to 100)
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  weights: RiskScoreWeights;
  calculatedAt: string;
}

export interface SiteScanSession {
  scanId: string;
  url: string;
  domain: string;
  rootDomain: string;
  startedAt: string;
  completedAt?: string;
  events: EvidenceEvent[];
  cookies: CookieObservation[];
  storage: StorageObservation[];
  permissions: PermissionObservation[];
  policyClaims: PolicyClaim[];
  findings: RealityGapFinding[];
  score: RiskScore;
}

// -------------------------------------------------------------
// Privacy & Data Sanitization Functions
// -------------------------------------------------------------

const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'access_token',
  'auth',
  'api_key',
  'apikey',
  'key',
  'secret',
  'session',
  'session_id',
  'sessionid',
  'email',
  'user',
  'userid',
  'user_id',
  'password',
  'pass',
  'jwt',
  'id_token',
  'oauth',
  'state',
  'nonce',
  'signature',
  'sig',
  'code',
  'refresh_token',
  'credit_card',
  'cc',
  'cvv',
  'phone',
  'mobile',
]);

/**
 * Strips secrets, personal identifiers, and tracking tags from URLs
 * before storing or transmitting metadata.
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const sanitizedParams = new URLSearchParams();

    url.searchParams.forEach((val, key) => {
      const lower = key.toLowerCase();
      // Drop explicitly sensitive keys
      if (SENSITIVE_QUERY_PARAMS.has(lower)) {
        sanitizedParams.set(key, '[REDACTED]');
        return;
      }
      // Drop suspected auth/token/secret substring patterns
      if (
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('password') ||
        lower.includes('email') ||
        lower.includes('auth')
      ) {
        sanitizedParams.set(key, '[REDACTED]');
        return;
      }
      // If the value looks like a JWT or large hex/base64 hash (> 48 chars), redact it
      if (val.length > 48 && (val.includes('.') || /^[a-fA-F0-9]+$/.test(val))) {
        sanitizedParams.set(key, '[REDACTED_ENTROPY]');
        return;
      }

      sanitizedParams.set(key, val);
    });

    url.search = sanitizedParams.toString() ? `?${sanitizedParams.toString()}` : '';
    url.hash = ''; // Drop fragments which might hold client-side tokens
    return url.toString();
  } catch {
    // If not a full URL (e.g. host only), return safely
    return rawUrl.split('?')[0];
  }
}

/**
 * Mathematical scoring engine implementation:
 * R = 0.35T + 0.25C + 0.15P + 0.25D
 * Privacy Score = 100 - R
 */
export function calculateRiskScore(
  t: number,
  c: number,
  p: number,
  d: number,
  weights: RiskScoreWeights = DEFAULT_RISK_WEIGHTS
): RiskScore {
  const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val * 10) / 10));

  const T = clamp(t);
  const C = clamp(c);
  const P = clamp(p);
  const D = clamp(d);

  const rawRisk = weights.T * T + weights.C * C + weights.P * P + weights.D * D;
  const riskScore = clamp(rawRisk);
  const overallPrivacyScore = clamp(100 - riskScore);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (overallPrivacyScore >= 85) grade = 'A';
  else if (overallPrivacyScore >= 70) grade = 'B';
  else if (overallPrivacyScore >= 55) grade = 'C';
  else if (overallPrivacyScore >= 40) grade = 'D';

  return {
    overallPrivacyScore,
    riskScore,
    trackingExposure: T,
    cookieExposure: C,
    permissionExposure: P,
    disclosureConcerns: D,
    grade,
    weights,
    calculatedAt: new Date().toISOString(),
  };
}

