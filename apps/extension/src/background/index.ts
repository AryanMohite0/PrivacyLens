/**
 * PRIVACYLENS — Chrome MV3 Background Service Worker
 * Local-First Deterministic Network Observer, Tracker Matcher, and Risk Assessor.
 */

import {
  CookieObservation,
  EvidenceEvent,
  PermissionObservation,
  SiteScanSession,
  StorageObservation,
  sanitizeUrl,
} from '../../../../packages/shared/src';
import { getRootDomain, isThirdPartyDomain } from '../../../../intelligence/domain_classifier';
import { trackerDatabase } from '../../../../intelligence/tracker_database';
import { RiskEngine } from '../../../../intelligence/risk_engine';

interface TabState {
  tabId: number;
  url: string;
  domain: string;
  rootDomain: string;
  startedAt: string;
  events: EvidenceEvent[];
  cookies: CookieObservation[];
  storage: StorageObservation[];
  permissions: PermissionObservation[];
  blockingEnabled: boolean;
}

const tabSessions = new Map<number, TabState>();
const riskEngine = new RiskEngine();

function getOrCreateTabState(tabId: number, url: string): TabState {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = 'unknown';
  }

  const existing = tabSessions.get(tabId);
  if (existing && existing.domain === hostname) {
    return existing;
  }

  const rootDomain = getRootDomain(hostname);
  const newState: TabState = {
    tabId,
    url,
    domain: hostname,
    rootDomain,
    startedAt: new Date().toISOString(),
    events: [],
    cookies: [],
    storage: [],
    permissions: [],
    blockingEnabled: false,
  };

  tabSessions.set(tabId, newState);
  return newState;
}

// -------------------------------------------------------------
// 1. Passive Network Request Observer (chrome.webRequest)
// -------------------------------------------------------------
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Exclude internal extensions and background tabs without ID
    if (details.tabId < 0 || details.url.startsWith('chrome-extension://')) {
      return;
    }

    const state = tabSessions.get(details.tabId);
    if (!state || !state.domain || state.domain === 'unknown') {
      return;
    }

    // Strip sensitive parameters immediately
    const sanitizedDestination = sanitizeUrl(details.url);

    let destinationHost = '';
    try {
      destinationHost = new URL(details.url).hostname;
    } catch {
      destinationHost = details.url.split('/')[2] || '';
    }

    if (!destinationHost) return;

    const destinationRoot = getRootDomain(destinationHost);
    const isThirdParty = isThirdPartyDomain(state.domain, destinationHost);

    // Tracker Database Match
    const trackerMatch = trackerDatabase.match(destinationHost);

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const event: EvidenceEvent = {
      id: eventId,
      scanId: `scan-${state.tabId}`,
      site: state.domain,
      siteRootDomain: state.rootDomain,
      eventType: 'third_party_request',
      destination: sanitizedDestination,
      destinationDomain: destinationHost,
      destinationRootDomain: destinationRoot,
      isThirdParty,
      resourceType: details.type || 'other',
      trackerMatch: trackerMatch.matched,
      trackerCategory: trackerMatch.category,
      trackerOwner: trackerMatch.owner,
      source: 'local_browser_observation',
      confidence: trackerMatch.matched ? trackerMatch.confidence : 1.0,
      timestamp: new Date().toISOString(),
    };

    // Avoid duplicate event flood for same domain and resource type
    const isDuplicate = state.events.some(
      (e) =>
        e.destinationDomain === destinationHost &&
        e.resourceType === event.resourceType &&
        Date.now() - new Date(e.timestamp).getTime() < 3000
    );

    if (!isDuplicate) {
      state.events.push(event);
      // Persist latest state
      chrome.storage.local.set({ [`scan_${state.tabId}`]: state });
    }
  },
  { urls: ['<all_urls>'] }
);

// -------------------------------------------------------------
// 2. Cookie Inspection
// -------------------------------------------------------------
async function refreshCookies(tabId: number, url: string) {
  const state = tabSessions.get(tabId);
  if (!state) return;

  try {
    const rawCookies = await chrome.cookies.getAll({ url });
    const observations: CookieObservation[] = rawCookies.map((c) => {
      const cookieRoot = getRootDomain(c.domain.startsWith('.') ? c.domain.slice(1) : c.domain);
      const isThirdParty = isThirdPartyDomain(state.domain, cookieRoot);

      let category: CookieObservation['category'] = 'functional';
      const nameLower = c.name.toLowerCase();
      if (
        nameLower.startsWith('_ga') ||
        nameLower.startsWith('_gid') ||
        nameLower.includes('analytics') ||
        nameLower.includes('utm')
      ) {
        category = 'analytics';
      } else if (
        nameLower.startsWith('_fbp') ||
        nameLower.startsWith('_fbc') ||
        nameLower.includes('pixel') ||
        nameLower.includes('ad')
      ) {
        category = 'advertising';
      }

      const expirationDays = c.expirationDate
        ? Math.round((c.expirationDate - Date.now() / 1000) / 86400)
        : undefined;

      return {
        name: c.name,
        domain: c.domain,
        path: c.path,
        isSecure: c.secure,
        isHttpOnly: c.httpOnly,
        sameSite: (c.sameSite as any) || 'unspecified',
        isSession: c.session,
        expirationDays,
        category,
        isThirdParty,
        retrievedAt: new Date().toISOString(),
      };
    });

    state.cookies = observations;
  } catch (err) {
    console.warn('[PRIVACYLENS] Error inspecting cookies:', err);
  }
}

// -------------------------------------------------------------
// 3. Tab Navigation & Lifecycle Listeners
// -------------------------------------------------------------
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
    getOrCreateTabState(tabId, tab.url);
  }
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    refreshCookies(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabSessions.delete(tabId);
  chrome.storage.local.remove([`scan_${tabId}`]);
});

// -------------------------------------------------------------
// 4. Runtime Messaging for Content Scripts & Popup
// -------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTENT_SCRIPT_OBSERVATION' && sender.tab?.id) {
    const state = tabSessions.get(sender.tab.id);
    if (state) {
      if (message.storage) {
        state.storage = message.storage;
      }
      if (message.permissions) {
        state.permissions = message.permissions;
      }
    }
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'GET_CURRENT_TAB_STATUS') {
    const tabId = message.tabId;
    const state = tabSessions.get(tabId);

    if (!state) {
      sendResponse({ active: false, reason: 'No active session for tab' });
      return true;
    }

    // Run deterministic risk assessment
    const assessment = riskEngine.assess({
      site: state.domain,
      events: state.events,
      cookies: state.cookies,
      storage: state.storage,
      permissions: state.permissions,
      policyClaims: [],
      policyDiscovered: true, // Content script updates this
    });

    sendResponse({
      active: true,
      domain: state.domain,
      rootDomain: state.rootDomain,
      url: state.url,
      eventsCount: state.events.length,
      trackersDetected: assessment.summary.knownTrackersCount,
      highRiskTrackers: assessment.summary.highRiskTrackers,
      categoriesDetected: assessment.summary.categoriesDetected,
      cookiesCount: state.cookies.length,
      thirdPartyCookiesCount: assessment.summary.thirdPartyCookiesCount,
      storageKeysCount: state.storage.length,
      score: assessment.score,
      findings: assessment.findings,
      blockingEnabled: state.blockingEnabled,
      recentEvents: state.events.slice(-10),
    });
    return true;
  }

  if (message.type === 'TOGGLE_BLOCKER') {
    const tabId = message.tabId;
    const state = tabSessions.get(tabId);
    if (state) {
      state.blockingEnabled = message.enabled;
      sendResponse({ success: true, blockingEnabled: state.blockingEnabled });
    }
    return true;
  }

  return false;
});

