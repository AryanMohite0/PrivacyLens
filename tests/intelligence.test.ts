import { describe, it, expect } from 'vitest';
import { sanitizeUrl, calculateRiskScore } from '../packages/shared/src';
import { getRootDomain, isThirdPartyDomain } from '../intelligence/domain_classifier';
import { trackerDatabase } from '../intelligence/tracker_database';
import { RiskEngine } from '../intelligence/risk_engine';

describe('PRIVACYLENS Deterministic Intelligence', () => {
  describe('Data Minimization & URL Sanitizer', () => {
    it('redacts sensitive query parameters like tokens, auth, keys, and emails', () => {
      const raw = 'https://analytics.example.com/collect?token=secret123&email=user@test.com&page=/home&auth=bearerXYZ';
      const sanitized = sanitizeUrl(raw);

      expect(sanitized).not.toContain('secret123');
      expect(sanitized).not.toContain('user@test.com');
      expect(sanitized).not.toContain('bearerXYZ');
      expect(sanitized).toContain('token=%5BREDACTED%5D');
      expect(sanitized).toContain('email=%5BREDACTED%5D');
      expect(sanitized).toContain('page=%2Fhome');
    });

    it('redacts high-entropy hash values exceeding threshold length', () => {
      const longHash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f61234';
      const raw = `https://ad.tracker.com/pixel?tracking_id=${longHash}&v=2`;
      const sanitized = sanitizeUrl(raw);

      expect(sanitized).not.toContain(longHash);
      expect(decodeURIComponent(sanitized)).toContain('[REDACTED_ENTROPY]');
      expect(sanitized).toContain('v=2');
    });
  });

  describe('Domain Classifier (eTLD+1)', () => {
    it('correctly extracts root domain for standard and multi-part TLDs', () => {
      expect(getRootDomain('https://checkout.store.nike.com')).toBe('nike.com');
      expect(getRootDomain('shop.product.co.uk')).toBe('product.co.uk');
      expect(getRootDomain('api.fintech.co.in')).toBe('fintech.co.in');
      expect(getRootDomain('localhost')).toBe('localhost');
    });

    it('determines first-party vs third-party status accurately', () => {
      expect(isThirdPartyDomain('nike.com', 'api.nike.com')).toBe(false);
      expect(isThirdPartyDomain('nike.com', 'assets.nike.com')).toBe(false);
      expect(isThirdPartyDomain('store.nike.co.uk', 'cdn.nike.co.uk')).toBe(false);
      expect(isThirdPartyDomain('store.nike.com', 'google-analytics.com')).toBe(true);
      expect(isThirdPartyDomain('brand.com', 'connect.facebook.net')).toBe(true);
    });
  });

  describe('Tracker Database Matcher', () => {
    it('matches known trackers with high confidence and accurate categories', () => {
      const ga = trackerDatabase.match('https://www.google-analytics.com/g/collect');
      expect(ga.matched).toBe(true);
      expect(ga.category).toBe('analytics');
      expect(ga.parentCompany).toBe('Alphabet Inc.');
      expect(ga.confidence).toBeGreaterThanOrEqual(0.95);

      const fb = trackerDatabase.match('connect.facebook.net');
      expect(fb.matched).toBe(true);
      expect(fb.category).toBe('advertising');
      expect(fb.owner).toBe('Meta');

      const fp = trackerDatabase.match('api.fpjs.io');
      expect(fp.matched).toBe(true);
      expect(fp.category).toBe('fingerprinting');
    });

    it('returns unknown for benign first-party or unrecognized domains', () => {
      const unknown = trackerDatabase.match('my-custom-backend.internal.org');
      expect(unknown.matched).toBe(false);
      expect(unknown.category).toBe('unknown');
    });
  });

  describe('Explainable Risk Engine', () => {
    it('calculates score according to R = 0.35T + 0.25C + 0.15P + 0.25D', () => {
      // T=60, C=40, P=20, D=50
      // R = 0.35*60 + 0.25*40 + 0.15*20 + 0.25*50 = 21 + 10 + 3 + 12.5 = 46.5
      // Privacy Score = 100 - 46.5 = 53.5
      const score = calculateRiskScore(60, 40, 20, 50);
      expect(score.riskScore).toBe(46.5);
      expect(score.overallPrivacyScore).toBe(53.5);
      expect(score.grade).toBe('D');
    });

    it('evaluates reality gap when advertising trackers are present but policy omits ads', () => {
      const engine = new RiskEngine();
      const result = engine.assess({
        site: 'ecommerce-shop.com',
        policyDiscovered: true,
        events: [
          {
            id: 'evt-1',
            scanId: 'scan-1',
            site: 'ecommerce-shop.com',
            siteRootDomain: 'ecommerce-shop.com',
            eventType: 'third_party_request',
            destination: 'https://connect.facebook.net/en_US/fbevents.js',
            destinationDomain: 'connect.facebook.net',
            destinationRootDomain: 'facebook.net',
            isThirdParty: true,
            resourceType: 'script',
            trackerMatch: true,
            trackerCategory: 'advertising',
            trackerOwner: 'Meta',
            source: 'local_browser_observation',
            confidence: 0.95,
            timestamp: new Date().toISOString(),
          },
        ],
        cookies: [],
        storage: [],
        permissions: [],
        policyClaims: [
          {
            id: 'claim-1',
            category: 'data_collection',
            claimText: 'We only collect essential order information to fulfill your shipments.',
            entitiesDisclosed: [],
            sourceExcerpt: 'Section 1',
            confidence: 0.9,
            isExplicit: true,
          },
        ],
      });

      const gapFinding = result.findings.find((f) => f.category === 'reality_gap');
      expect(gapFinding).toBeDefined();
      expect(gapFinding?.status).toBe('potentially_inconsistent');
      expect(gapFinding?.title).toContain('Undisclosed Third-Party Advertising');
    });
  });
});
