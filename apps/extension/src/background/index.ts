/**
 * PRIVACYLENS — Chrome MV3 Background Service Worker
 * Real-Time Dynamic Network Observer, Tracker Matcher, DeclarativeNetRequest Blocker,
 * and In-Extension Grounded Risk Engine.
 */

import {
  CookieObservation,
  EvidenceEvent,
  PermissionObservation,
  PolicyClaim,
  RealityGapFinding,
  RiskScore,
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
  policyUrl: string | null;
  policyClaims: PolicyClaim[];
  findings: RealityGapFinding[];
  score: RiskScore | null;
  blockingEnabled: boolean;
  blockedRequestsCount: number;
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
    policyUrl: null,
    policyClaims: [],
    findings: [],
    score: null,
    blockingEnabled: false,
    blockedRequestsCount: 0,
  };

  tabSessions.set(tabId, newState);
  updateBadge(tabId, 0);
  return newState;
}

function updateBadge(tabId: number, count: number) {
  try {
    if (count > 0) {
      chrome.action.setBadgeText({ tabId, text: String(count) });
      chrome.action.setBadgeBackgroundColor({
        tabId,
        color: count >= 8 ? '#f43f5e' : count >= 3 ? '#f59e0b' : '#10b981',
      });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch {
    // Tab closed or not available
  }
}

// -------------------------------------------------------------
// 1. DeclarativeNetRequest Rule Enforcement (Tracker Blocker)
// -------------------------------------------------------------
const BLOCKER_RULE_ID_OFFSET = 1000;

async function updateBlockingRules(enabled: boolean) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((r) => r.id);

    if (!enabled) {
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
      }
      return;
    }

    // Build block rules from top known tracker domains
    const trackers = trackerDatabase.getAllTrackers();
    const newRules: chrome.declarativeNetRequest.Rule[] = [];
    let idCounter = BLOCKER_RULE_ID_OFFSET;

    for (const tracker of trackers) {
      for (const domain of tracker.domains) {
        newRules.push({
          id: idCounter++,
          priority: 1,
          action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
          condition: {
            urlFilter: `||${domain}^`,
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.SCRIPT,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.IMAGE,
              chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
            ],
          },
        });
        if (newRules.length >= 100) break;
      }
      if (newRules.length >= 100) break;
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules,
    });
  } catch (err) {
    console.warn('[PRIVACYLENS] Error updating blocker rules:', err);
  }
}

// -------------------------------------------------------------
// 2. Real-Time Passive Network Request Observer
// -------------------------------------------------------------
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0 || details.url.startsWith('chrome-extension://')) {
      return;
    }

    const state = tabSessions.get(details.tabId);
    if (!state || !state.domain || state.domain === 'unknown') {
      return;
    }

    // Sanitize parameters immediately
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

    // Match against deterministic tracker intelligence
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

    // Avoid duplicate flood within 2 seconds
    const isDuplicate = state.events.some(
      (e) =>
        e.destinationDomain === destinationHost &&
        e.resourceType === event.resourceType &&
        Date.now() - new Date(e.timestamp).getTime() < 2000
    );

    if (!isDuplicate) {
      state.events.unshift(event);
      if (state.events.length > 300) state.events.pop();

      // Recalculate score and badge
      const assessment = riskEngine.assess({
        site: state.domain,
        events: state.events,
        cookies: state.cookies,
        storage: state.storage,
        permissions: state.permissions,
        policyClaims: state.policyClaims,
        policyDiscovered: state.policyUrl !== null || state.policyClaims.length > 0,
      });

      state.score = assessment.score;
      state.findings = assessment.findings;

      updateBadge(state.tabId, assessment.summary.knownTrackersCount);

      // Broadcast live event to open popup or side panel in real-time
      chrome.runtime.sendMessage({
        type: 'REALTIME_TELEMETRY_EVENT',
        tabId: state.tabId,
        event,
        score: state.score,
        findings: state.findings,
        trackersCount: assessment.summary.knownTrackersCount,
        categoriesDetected: assessment.summary.categoriesDetected,
      }).catch(() => {
        // Normal when popup/sidepanel is closed
      });
    }
  },
  { urls: ['<all_urls>'] }
);

// -------------------------------------------------------------
// 3. Real-Time Cookie Inspection
// -------------------------------------------------------------
async function refreshCookies(tabId: number, url: string) {
  const state = tabSessions.get(tabId);
  if (!state) return;

  try {
    const rawCookies = await chrome.cookies.getAll({ url });
    state.cookies = rawCookies.map((c) => {
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
  } catch (err) {
    console.warn('[PRIVACYLENS] Cookie read error:', err);
  }
}

// -------------------------------------------------------------
// 4. Tab Lifecycle & Navigation
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
});

// -------------------------------------------------------------
// 5. In-Extension Privacy Policy Claim Parser
// -------------------------------------------------------------
function extractPolicyClaimsLocally(text: string): PolicyClaim[] {
  const claims: PolicyClaim[] = [];
  const clean = text.replace(/\s+/g, ' ');

  const checks = [
    {
      category: 'advertising_targeting' as const,
      regex: /(?:targeted|tailored|behavioral|interest-based)\s+advertising|cross-context\s+advertising/i,
      label: 'Targeted behavioral advertising & retargeting partners',
    },
    {
      category: 'third_party_sharing' as const,
      regex: /(?:we\s+share|we\s+disclose)\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+with\s+third\s+parties/i,
      label: 'Third-party commercial marketing disclosure',
    },
    {
      category: 'data_sale' as const,
      regex: /we\s+do\s+not\s+sell\s+your\s+personal\s+(?:data|information)|opt-out\s+of\s+the\s+sale/i,
      label: 'CCPA Do Not Sell personal information disclosure',
    },
    {
      category: 'user_rights' as const,
      regex: /(?:right\s+to\s+access|right\s+to\s+delete|right\s+to\s+opt-out|GDPR|CCPA)/i,
      label: 'User rights to access, delete, and restrict processing',
    },
  ];

  for (const c of checks) {
    const match = clean.match(c.regex);
    if (match && match.index !== undefined) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(clean.length, match.index + match[0].length + 50);
      claims.push({
        id: `claim-${c.category}-${Math.random().toString(36).substring(2, 6)}`,
        category: c.category,
        claimText: c.label,
        entitiesDisclosed: [],
        sourceExcerpt: `...${clean.substring(start, end).trim()}...`,
        confidence: 0.9,
        isExplicit: true,
      });
    }
  }

  return claims;
}

// -------------------------------------------------------------
// 6. Messaging Router for Extension UI
// -------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTENT_SCRIPT_OBSERVATION' && sender.tab?.id) {
    const state = tabSessions.get(sender.tab.id);
    if (state) {
      if (message.storage) state.storage = message.storage;
      if (message.permissions) state.permissions = message.permissions;
      if (message.policyUrl) state.policyUrl = message.policyUrl;
    }
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'GET_TAB_TELEMETRY') {
    const tabId = message.tabId;
    const state = tabSessions.get(tabId);
    if (!state) {
      sendResponse({ active: false });
      return true;
    }

    const assessment = riskEngine.assess({
      site: state.domain,
      events: state.events,
      cookies: state.cookies,
      storage: state.storage,
      permissions: state.permissions,
      policyClaims: state.policyClaims,
      policyDiscovered: state.policyUrl !== null || state.policyClaims.length > 0,
    });

    state.score = assessment.score;
    state.findings = assessment.findings;

    sendResponse({
      active: true,
      tabId: state.tabId,
      domain: state.domain,
      rootDomain: state.rootDomain,
      url: state.url,
      events: state.events,
      cookies: state.cookies,
      storage: state.storage,
      permissions: state.permissions,
      policyUrl: state.policyUrl,
      policyClaims: state.policyClaims,
      findings: state.findings,
      score: state.score,
      blockingEnabled: state.blockingEnabled,
      trackersCount: assessment.summary.knownTrackersCount,
      highRiskTrackers: assessment.summary.highRiskTrackers,
      categoriesDetected: assessment.summary.categoriesDetected,
    });
    return true;
  }

  if (message.type === 'TOGGLE_TRACKER_GUARD') {
    const tabId = message.tabId;
    const state = tabSessions.get(tabId);
    if (state) {
      state.blockingEnabled = message.enabled;
      updateBlockingRules(state.blockingEnabled);
      sendResponse({ success: true, blockingEnabled: state.blockingEnabled });
    }
    return true;
  }

  if (message.type === 'AUDIT_POLICY_NOW') {
    const tabId = message.tabId;
    const state = tabSessions.get(tabId);
    if (!state || !state.policyUrl) {
      sendResponse({ success: false, reason: 'No policy URL detected for this domain' });
      return true;
    }

    fetch(state.policyUrl)
      .then((res) => res.text())
      .then((html) => {
        const text = html.replace(/<[^>]*>/g, ' ');
        state.policyClaims = extractPolicyClaimsLocally(text);

        const assessment = riskEngine.assess({
          site: state.domain,
          events: state.events,
          cookies: state.cookies,
          storage: state.storage,
          permissions: state.permissions,
          policyClaims: state.policyClaims,
          policyDiscovered: true,
        });

        state.score = assessment.score;
        state.findings = assessment.findings;

        sendResponse({
          success: true,
          policyClaims: state.policyClaims,
          score: state.score,
          findings: state.findings,
        });
      })
      .catch((err) => {
        sendResponse({ success: false, reason: String(err) });
      });

    return true;
  }

  if (message.type === 'COPILOT_QUERY_LOCAL') {
    const tabId = message.tabId;
    const state = tabSessions.get(tabId);
    const q = (message.question || '').toLowerCase();

    if (!state) {
      sendResponse({ answer: 'No active session found.' });
      return true;
    }

    let ans = '';
    const uniqueTrackers = Array.from(new Set(state.events.filter((e) => e.trackerMatch).map((e) => e.trackerOwner || e.destinationDomain)));

    if (q.includes('score') || q.includes('why') || q.includes('grade')) {
      ans = `PRIVACYLENS evaluated \`${state.domain}\` with a Privacy Score of **${state.score?.overallPrivacyScore ?? 50}/100** (Grade **${state.score?.grade ?? 'C'}**).\n\n` +
        `• **Tracking Exposure**: ${state.score?.trackingExposure ?? 0}/100 (${uniqueTrackers.length} active trackers)\n` +
        `• **Cookie Exposure**: ${state.score?.cookieExposure ?? 0}/100 (${state.cookies.length} total cookies, ${state.cookies.filter(c => c.isThirdParty).length} third-party)\n` +
        `• **Formula**: 100 - (0.35T + 0.25C + 0.15P + 0.25D)`;
    } else if (q.includes('facebook') || q.includes('google') || q.includes('ad') || q.includes('pixel')) {
      const adTrackers = state.events.filter((e) => e.trackerMatch && (e.trackerCategory === 'advertising' || e.trackerOwner?.includes('Meta') || e.trackerOwner?.includes('Google')));
      if (adTrackers.length > 0) {
        ans = `Observed **${adTrackers.length}** ad network requests on this page:\n` +
          Array.from(new Set(adTrackers.map((e) => `• **${e.trackerOwner || e.destinationDomain}** (${e.destinationDomain})`))).join('\n');
      } else {
        ans = `No direct Facebook Pixel or third-party ad retargeting requests were observed during this active session on \`${state.domain}\`.`;
      }
    } else if (q.includes('clarity') || q.includes('hotjar') || q.includes('session') || q.includes('record')) {
      const fp = state.events.filter((e) => e.trackerMatch && e.trackerCategory === 'fingerprinting');
      if (fp.length > 0) {
        ans = `⚠️ **Session Replay Detected**: Active connection to **${fp[0].trackerOwner || fp[0].destinationDomain}** (${fp[0].destinationDomain}). This technology records user mouse trajectories and DOM layout changes.`;
      } else {
        ans = `No active session recording (e.g. Clarity, Hotjar) or hardware fingerprinting was observed on \`${state.domain}\`.`;
      }
    } else {
      ans = `PRIVACYLENS has recorded **${state.events.length}** live network requests and **${uniqueTrackers.length}** verified trackers for \`${state.domain}\`.\n\n` +
        `Ask about: "Why is this site grade ${state.score?.grade}?", "Are session recorders active?", or "Which ad networks receive my data?"`;
    }

    sendResponse({
      answer: ans,
      confidence: 0.95,
      citations: uniqueTrackers.slice(0, 3).map((t) => ({ entity: t })),
    });
    return true;
  }

  return false;
});
