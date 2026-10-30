/**
 * PRIVACYLENS — Tracker Database Matcher
 * Fast, deterministic lookup engine matching observed destinations against verified tracker lists.
 */

import trackerData from './trackers.json';
import { getRootDomain } from '../domain_classifier';
import { TrackerCategory, TrackerMatch } from '../../packages/shared/src';

export interface TrackerDefinition {
  name: string;
  domains: string[];
  category: TrackerCategory;
  owner: string;
  parentCompany: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

class TrackerDatabase {
  private exactDomainMap: Map<string, TrackerDefinition> = new Map();
  private rootDomainMap: Map<string, TrackerDefinition> = new Map();

  constructor() {
    this.indexTrackers();
  }

  private indexTrackers() {
    for (const tracker of trackerData.trackers as TrackerDefinition[]) {
      for (const domain of tracker.domains) {
        const lower = domain.toLowerCase();
        this.exactDomainMap.set(lower, tracker);
        const root = getRootDomain(lower);
        if (root) {
          this.rootDomainMap.set(root, tracker);
        }
      }
    }
  }

  /**
   * Matches a destination host or URL against the tracker database.
   * Checks exact domain match first (highest confidence), then root domain match.
   */
  public match(destination: string): TrackerMatch {
    let hostname = destination.toLowerCase().trim();
    try {
      if (hostname.includes('://')) {
        hostname = new URL(hostname).hostname;
      }
    } catch {
      // Use fallback
    }
    hostname = hostname.split(':')[0];

    // 1. Exact hostname match
    if (this.exactDomainMap.has(hostname)) {
      const match = this.exactDomainMap.get(hostname)!;
      return {
        matched: true,
        trackerName: match.name,
        category: match.category,
        owner: match.owner,
        parentCompany: match.parentCompany,
        source: 'privacylens_curated',
        confidence: 0.99,
      };
    }

    // 2. Subdomain match (e.g. "ssl.google-analytics.com" or "custom.pixel.facebook.com")
    for (const [knownDomain, match] of this.exactDomainMap.entries()) {
      if (hostname.endsWith(`.${knownDomain}`)) {
        return {
          matched: true,
          trackerName: match.name,
          category: match.category,
          owner: match.owner,
          parentCompany: match.parentCompany,
          source: 'privacylens_curated',
          confidence: 0.95,
        };
      }
    }

    // 3. Root domain match
    const root = getRootDomain(hostname);
    if (this.rootDomainMap.has(root)) {
      const match = this.rootDomainMap.get(root)!;
      return {
        matched: true,
        trackerName: match.name,
        category: match.category,
        owner: match.owner,
        parentCompany: match.parentCompany,
        source: 'privacylens_curated',
        confidence: 0.88,
      };
    }

    // Heuristic tracker pattern checks
    if (
      /(^|\.)(analytics|telemetry|track(ing)?|pixel|ads|beacon|metrics)\./i.test(hostname)
    ) {
      return {
        matched: true,
        trackerName: `Heuristic Tracker (${hostname})`,
        category: hostname.includes('pixel') || hostname.includes('ads') ? 'advertising' : 'analytics',
        owner: 'Unknown Ad/Analytics Provider',
        parentCompany: 'Unknown',
        source: 'heuristic',
        confidence: 0.65,
      };
    }

    return {
      matched: false,
      category: 'unknown',
      source: 'none',
      confidence: 0,
    };
  }

  public getAllTrackers(): TrackerDefinition[] {
    return trackerData.trackers as TrackerDefinition[];
  }
}

export const trackerDatabase = new TrackerDatabase();
