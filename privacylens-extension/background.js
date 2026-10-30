/**
 * PRIVACYLENS — Background Service Worker
 * Standalone Deterministic Real-Time Network Observer, Tracker Intelligence,
 * DeclarativeNetRequest Guard, and Explainable Risk Engine.
 */

// -------------------------------------------------------------
// 1. Curated Tracker Database (Offline & Deterministic)
// -------------------------------------------------------------
const TRACKER_REGISTRY = [
  {
    name: 'Google Analytics',
    domains: ['google-analytics.com', 'ssl.google-analytics.com', 'analytics.google.com'],
    category: 'analytics',
    owner: 'Google',
    parentCompany: 'Alphabet Inc.',
    risk: 'medium',
    description: 'Tracks user visits, traffic attribution, and page navigation flows.',
  },
  {
    name: 'Google Tag Manager',
    domains: ['googletagmanager.com'],
    category: 'analytics',
    owner: 'Google',
    parentCompany: 'Alphabet Inc.',
    risk: 'medium',
    description: 'Container script dynamically injecting marketing tags and pixels.',
  },
  {
    name: 'Google DoubleClick & AdServices',
    domains: ['doubleclick.net', 'googleadservices.com', 'googlesyndication.com', 'adservice.google.com'],
    category: 'advertising',
    owner: 'Google Ads',
    parentCompany: 'Alphabet Inc.',
    risk: 'high',
    description: 'Behavioral profiling, cross-site retargeting, and ad conversion tracking.',
  },
  {
    name: 'Meta Pixel & Graph',
    domains: ['connect.facebook.net', 'facebook.com', 'facebook.net', 'pixel.facebook.com'],
    category: 'advertising',
    owner: 'Meta',
    parentCompany: 'Meta Platforms, Inc.',
    risk: 'high',
    description: 'Monitors catalog browsing and syncs actions with personal Facebook profiles.',
  },
  {
    name: 'TikTok Pixel',
    domains: ['analytics.tiktok.com', 'byteoversea.com', 'ibytedtos.com'],
    category: 'advertising',
    owner: 'TikTok',
    parentCompany: 'ByteDance Ltd.',
    risk: 'high',
    description: 'Matches off-site shopping events with TikTok profiles for targeted ads.',
  },
  {
    name: 'Microsoft Clarity',
    domains: ['clarity.ms'],
    category: 'fingerprinting',
    owner: 'Microsoft',
    parentCompany: 'Microsoft Corp.',
    risk: 'high',
    description: 'Session replay recording mouse trajectories, scroll heatmaps, and rage clicks.',
  },
  {
    name: 'Microsoft Bing Ads & Xandr',
    domains: ['bat.bing.com', 'adnxs.com', 'xandr.com'],
    category: 'advertising',
    owner: 'Microsoft Advertising',
    parentCompany: 'Microsoft Corp.',
    risk: 'high',
    description: 'Real-time programmatic ad exchange and search retargeting.',
  },
  {
    name: 'Amazon Advertising',
    domains: ['amazon-adsystem.com', 'aax.amazon-adsystem.com', 'fls-na.amazon.com'],
    category: 'advertising',
    owner: 'Amazon Ads',
    parentCompany: 'Amazon.com, Inc.',
    risk: 'high',
    description: 'Cross-site sponsored product recommendations and attribution.',
  },
  {
    name: 'Criteo Retargeting',
    domains: ['criteo.com', 'criteo.net'],
    category: 'advertising',
    owner: 'Criteo',
    parentCompany: 'Criteo S.A.',
    risk: 'high',
    description: 'Dynamic retargeting matching viewed products across external publishers.',
  },
  {
    name: 'The Trade Desk',
    domains: ['adsrvr.org', 'thetradedesk.com'],
    category: 'advertising',
    owner: 'The Trade Desk',
    parentCompany: 'The Trade Desk, Inc.',
    risk: 'high',
    description: 'Demand-side platform syncing cross-device cookie IDs.',
  },
  {
    name: 'LiveRamp Identity Graph',
    domains: ['rlcdn.com', 'liveramp.com'],
    category: 'advertising',
    owner: 'LiveRamp',
    parentCompany: 'LiveRamp Holdings, Inc.',
    risk: 'high',
    description: 'Connects offline customer records with online browser cookies.',
  },
  {
    name: 'Hotjar Session Recorder',
    domains: ['hotjar.com', 'script.hotjar.com', 'vars.hotjar.com'],
    category: 'fingerprinting',
    owner: 'Hotjar',
    parentCompany: 'Contentsquare',
    risk: 'high',
    description: 'Keystroke monitoring, session playback, and DOM form recordings.',
  },
  {
    name: 'FingerprintJS Pro',
    domains: ['fpjs.io', 'fingerprintjs.com', 'api.fpjs.io'],
    category: 'fingerprinting',
    owner: 'Fingerprint',
    parentCompany: 'FingerprintJS, Inc.',
    risk: 'critical',
    description: 'Canvas, WebGL, audio, and hardware fingerprinting bypassing cookie clearing.',
  },
];

// Fast Domain Indexing
const EXACT_DOMAIN_MAP = new Map();
const ROOT_DOMAIN_MAP = new Map();

for (const tracker of TRACKER_REGISTRY) {
  for (const d of tracker.domains) {
    const lower = d.toLowerCase();
    EXACT_DOMAIN_MAP.set(lower, tracker);
    const parts = lower.split('.');
    const root = parts.length > 2 ? parts.slice(-2).join('.') : lower;
    ROOT_DOMAIN_MAP.set(root, tracker);
  }
}

// -------------------------------------------------------------
// 2. Domain Classifier (eTLD+1)
// -------------------------------------------------------------
const MULTI_PART_TLDS = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'com.au', 'net.au', 'org.au',
  'co.in', 'net.in', 'org.in', 'co.jp', 'ne.jp', 'com.br',
  'co.nz', 'com.mx', 'com.sg', 'com.de', 'com.fr',
]);

function getRootDomain(hostnameOrUrl) {
  let hostname = (hostnameOrUrl || '').trim().toLowerCase();
  try {
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }
  } catch (_) {}
  hostname = hostname.split(':')[0];

  if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return hostname;
  }

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) return hostname;

  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_TLDS.has(lastTwo)) {
    return parts.length >= 3 ? parts.slice(-3).join('.') : hostname;
  }
  return parts.slice(-2).join('.');
}

function isThirdPartyDomain(siteDomain, targetDomain) {
  const siteRoot = getRootDomain(siteDomain);
  const targetRoot = getRootDomain(targetDomain);
  return Boolean(siteRoot && targetRoot && siteRoot !== targetRoot);
}

// -------------------------------------------------------------
// 3. Sensitive Parameter Redaction (Data Minimization)
// -------------------------------------------------------------
const SENSITIVE_KEYS = new Set([
  'token', 'access_token', 'auth', 'api_key', 'apikey', 'key',
  'secret', 'session', 'session_id', 'sessionid', 'email', 'user',
  'userid', 'password', 'pass', 'jwt', 'oauth', 'state', 'nonce',
]);

function sanitizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const sanitized = new URLSearchParams();

    url.searchParams.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lower) || lower.includes('token') || lower.includes('secret') || lower.includes('auth')) {
        sanitized.set(key, '[REDACTED]');
      } else if (val.length > 48 && (val.includes('.') || /^[a-fA-F0-9]+$/.test(val))) {
        sanitized.set(key, '[REDACTED_ENTROPY]');
      } else {
        sanitized.set(key, val);
      }
    });

    url.search = sanitized.toString() ? `?${sanitized.toString()}` : '';
    url.hash = '';
    return url.toString();
  } catch (_) {
    return (rawUrl || '').split('?')[0];
  }
}

// -------------------------------------------------------------
// 4. Session State & Scoring Math
// -------------------------------------------------------------
const tabSessions = new Map();

function matchTracker(hostname) {
  const lower = (hostname || '').toLowerCase();
  if (EXACT_DOMAIN_MAP.has(lower)) {
    const t = EXACT_DOMAIN_MAP.get(lower);
    return { matched: true, ...t, confidence: 0.99 };
  }
  for (const [known, t] of EXACT_DOMAIN_MAP.entries()) {
    if (lower.endsWith(`.${known}`)) {
      return { matched: true, ...t, confidence: 0.95 };
    }
  }
  const root = getRootDomain(lower);
  if (ROOT_DOMAIN_MAP.has(root)) {
    const t = ROOT_DOMAIN_MAP.get(root);
    return { matched: true, ...t, confidence: 0.88 };
  }
  return { matched: false, category: 'unknown', confidence: 0 };
}

function calculateScore(events, cookies, storage, policyClaims, policyDiscovered) {
  const findings = [];

  // T: Tracking Exposure
  const matched = events.filter((e) => e.trackerMatch);
  const uniqueTrackers = new Map();
  let rawT = 0;

  for (const e of matched) {
    const key = e.trackerOwner || e.destinationDomain;
    if (!uniqueTrackers.has(key)) {
      uniqueTrackers.set(key, e);
      if (e.trackerCategory === 'fingerprinting') {
        rawT += 35;
        findings.push({
          id: `fp-${e.destinationDomain}`,
          title: `Session Recording Script (${key})`,
          severity: 'high',
          observed: `Loaded ${e.destinationDomain} capturing DOM replay and mouse telemetry.`,
          claim: 'Requires explicit prior consent under ePrivacy / GDPR.',
          references: [e.destinationDomain],
        });
      } else if (e.trackerCategory === 'advertising') {
        rawT += 18;
      } else if (e.trackerCategory === 'analytics') {
        rawT += 8;
      } else {
        rawT += 5;
      }
    }
  }

  const thirdPartyRequests = events.filter((e) => e.isThirdParty);
  if (thirdPartyRequests.length > 25) rawT += 15;
  else if (thirdPartyRequests.length > 10) rawT += 8;

  const T = Math.min(100, rawT);

  // C: Cookie & Storage Exposure
  let rawC = 0;
  const thirdPartyCookies = cookies.filter((c) => c.isThirdParty);
  rawC += thirdPartyCookies.length * 15;

  const insecureCookies = cookies.filter((c) => !c.isSecure);
  if (insecureCookies.length > 0) {
    rawC += Math.min(25, insecureCookies.length * 8);
    findings.push({
      id: 'insecure-cookie',
      title: `${insecureCookies.length} Insecure (Plain HTTP) Cookie(s)`,
      severity: 'medium',
      observed: `Cookies ${insecureCookies.slice(0, 3).map((c) => c.name).join(', ')} lack the Secure SSL flag.`,
      claim: 'Sensitive cookies must be delivered over encrypted HTTPS.',
      references: insecureCookies.map((c) => c.name),
    });
  }

  const highEntropyStorage = storage.filter((s) => s.isHighEntropy);
  if (highEntropyStorage.length > 0) {
    rawC += Math.min(30, highEntropyStorage.length * 10);
    findings.push({
      id: 'storage-id',
      title: 'Persistent Unique ID in LocalStorage',
      severity: 'medium',
      observed: `Identified keys: ${highEntropyStorage.slice(0, 3).map((s) => s.key).join(', ')} with tracking signatures.`,
      claim: 'LocalStorage tokens survive cookie clearing and sync cross-site IDs.',
      references: highEntropyStorage.map((s) => s.key),
    });
  }

  const C = Math.min(100, rawC);

  // P: Permission Exposure
  const P = 0;

  // D: Disclosure & Reality Gap
  let rawD = 0;
  if (!policyDiscovered) {
    rawD += 40;
    findings.push({
      id: 'no-policy',
      title: 'No Accessible Privacy Policy Found',
      severity: 'high',
      observed: 'Automated inspection detected no privacy disclosure URL in page DOM.',
      claim: 'Websites must provide prominent, accessible privacy disclosures.',
      references: ['active_page'],
    });
  } else {
    // Check Reality Gap: Ad trackers present vs policy mention
    const adTrackers = events.filter((e) => e.trackerMatch && e.trackerCategory === 'advertising');
    const mentionsAds = policyClaims.some((c) => c.category === 'advertising_targeting' || c.claimText.toLowerCase().includes('ad'));

    if (adTrackers.length > 0 && !mentionsAds) {
      rawD += 35;
      findings.push({
        id: 'gap-ads',
        title: 'Undisclosed Ad Retargeting Trackers Detected',
        severity: 'high',
        observed: `Detected ${adTrackers.length} ad trackers (${adTrackers.slice(0, 3).map((e) => e.destinationDomain).join(', ')}).`,
        claim: 'Policy does not disclose third-party advertising or retargeting partners.',
        references: adTrackers.map((e) => e.destinationDomain),
      });
    }
  }
  const D = Math.min(100, rawD);

  // R = 0.35T + 0.25C + 0.15P + 0.25D
  const rawRisk = 0.35 * T + 0.25 * C + 0.15 * P + 0.25 * D;
  const riskScore = Math.max(0, Math.min(100, Math.round(rawRisk * 10) / 10));
  const overallPrivacyScore = Math.max(0, Math.min(100, Math.round((100 - riskScore) * 10) / 10));

  let grade = 'F';
  if (overallPrivacyScore >= 85) grade = 'A';
  else if (overallPrivacyScore >= 70) grade = 'B';
  else if (overallPrivacyScore >= 55) grade = 'C';
  else if (overallPrivacyScore >= 40) grade = 'D';

  return {
    score: {
      overallPrivacyScore,
      riskScore,
      trackingExposure: T,
      cookieExposure: C,
      permissionExposure: P,
      disclosureConcerns: D,
      grade,
    },
    findings,
    uniqueTrackersCount: uniqueTrackers.size,
  };
}

function updateBadge(tabId, count) {
  try {
    if (count > 0) {
      chrome.action.setBadgeText({ tabId, text: String(count) });
      chrome.action.setBadgeBackgroundColor({
        tabId,
        color: count >= 6 ? '#f43f5e' : count >= 3 ? '#f59e0b' : '#10b981',
      });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch (_) {}
}

// -------------------------------------------------------------
// 5. Dynamic Blocker (declarativeNetRequest)
// -------------------------------------------------------------
async function updateBlockerRules(enabled) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existing.map((r) => r.id);

    if (!enabled) {
      if (existingIds.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existingIds });
      }
      return;
    }

    const rules = [];
    let id = 1000;
    for (const tracker of TRACKER_REGISTRY) {
      for (const d of tracker.domains) {
        rules.push({
          id: id++,
          priority: 1,
          action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
          condition: {
            urlFilter: `||${d}^`,
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.SCRIPT,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.IMAGE,
              chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
            ],
          },
        });
        if (rules.length >= 80) break;
      }
      if (rules.length >= 80) break;
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: rules,
    });
  } catch (_) {}
}

// -------------------------------------------------------------
// 6. Real-Time Network Request Observer
// -------------------------------------------------------------
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0 || details.url.startsWith('chrome-extension://')) return;

    let state = tabSessions.get(details.tabId);
    if (!state) return;

    let destHost = '';
    try {
      destHost = new URL(details.url).hostname;
    } catch (_) {
      destHost = details.url.split('/')[2] || '';
    }
    if (!destHost) return;

    const isThirdParty = isThirdPartyDomain(state.domain, destHost);
    const match = matchTracker(destHost);
    const sanitized = sanitizeUrl(details.url);

    const event = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      site: state.domain,
      destination: sanitized,
      destinationDomain: destHost,
      isThirdParty,
      resourceType: details.type || 'other',
      trackerMatch: match.matched,
      trackerName: match.name,
      trackerCategory: match.category,
      trackerOwner: match.parentCompany || match.owner,
      risk: match.risk || 'low',
      confidence: match.confidence,
    };

    // Avoid duplicate flood within 2 seconds
    const isDup = state.events.some(
      (e) => e.destinationDomain === destHost && e.resourceType === event.resourceType && Date.now() - e._rawTime < 2000
    );

    if (!isDup) {
      event._rawTime = Date.now();
      state.events.unshift(event);
      if (state.events.length > 250) state.events.pop();

      const assessment = calculateScore(
        state.events,
        state.cookies,
        state.storage,
        state.policyClaims,
        state.policyUrl !== null || state.policyClaims.length > 0
      );

      state.score = assessment.score;
      state.findings = assessment.findings;
      updateBadge(state.tabId, assessment.uniqueTrackersCount);

      // Broadcast live event to open popup
      chrome.runtime.sendMessage({
        type: 'REALTIME_TELEMETRY',
        tabId: state.tabId,
        event,
        score: state.score,
        findings: state.findings,
        trackersCount: assessment.uniqueTrackersCount,
      }).catch(() => {});
    }
  },
  { urls: ['<all_urls>'] }
);

// -------------------------------------------------------------
// 7. Cookies, Tabs & Content Scripts
// -------------------------------------------------------------
async function refreshCookies(tabId, url) {
  const state = tabSessions.get(tabId);
  if (!state) return;

  try {
    const raw = await chrome.cookies.getAll({ url });
    state.cookies = raw.map((c) => {
      const cookieRoot = getRootDomain(c.domain.startsWith('.') ? c.domain.slice(1) : c.domain);
      const isThirdParty = isThirdPartyDomain(state.domain, cookieRoot);

      let category = 'functional';
      const name = c.name.toLowerCase();
      if (name.startsWith('_ga') || name.startsWith('_gid') || name.includes('analytics')) {
        category = 'analytics';
      } else if (name.startsWith('_fbp') || name.startsWith('_fbc') || name.includes('pixel') || name.includes('ad')) {
        category = 'advertising';
      }

      return {
        name: c.name,
        domain: c.domain,
        isSecure: c.secure,
        isHttpOnly: c.httpOnly,
        isThirdParty,
        category,
        expirationDays: c.expirationDate ? Math.round((c.expirationDate - Date.now() / 1000) / 86400) : null,
      };
    });
  } catch (_) {}
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
    let hostname = '';
    try {
      hostname = new URL(tab.url).hostname;
    } catch (_) {}

    tabSessions.set(tabId, {
      tabId,
      url: tab.url,
      domain: hostname,
      startedAt: new Date().toISOString(),
      events: [],
      cookies: [],
      storage: [],
      policyUrl: null,
      policyClaims: [],
      findings: [],
      score: null,
      blockingEnabled: false,
    });
    updateBadge(tabId, 0);
  }

  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    refreshCookies(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabSessions.delete(tabId);
});

// -------------------------------------------------------------
// 8. Runtime Messaging (Popup & Content Script)
// -------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CONTENT_OBSERVATION' && sender.tab?.id) {
    const state = tabSessions.get(sender.tab.id);
    if (state) {
      if (msg.storage) state.storage = msg.storage;
      if (msg.policyUrl) state.policyUrl = msg.policyUrl;
    }
    sendResponse({ status: 'ok' });
    return true;
  }

  if (msg.type === 'GET_STATE') {
    const state = tabSessions.get(msg.tabId);
    if (!state) {
      sendResponse({ active: false });
      return true;
    }

    const assessment = calculateScore(
      state.events,
      state.cookies,
      state.storage,
      state.policyClaims,
      state.policyUrl !== null || state.policyClaims.length > 0
    );

    state.score = assessment.score;
    state.findings = assessment.findings;

    sendResponse({
      active: true,
      tabId: state.tabId,
      domain: state.domain,
      url: state.url,
      events: state.events,
      cookies: state.cookies,
      storage: state.storage,
      policyUrl: state.policyUrl,
      policyClaims: state.policyClaims,
      findings: state.findings,
      score: state.score,
      blockingEnabled: state.blockingEnabled,
      trackersCount: assessment.uniqueTrackersCount,
    });
    return true;
  }

  if (msg.type === 'TOGGLE_GUARD') {
    const state = tabSessions.get(msg.tabId);
    if (state) {
      state.blockingEnabled = msg.enabled;
      updateBlockerRules(state.blockingEnabled);
      sendResponse({ success: true, blockingEnabled: state.blockingEnabled });
    }
    return true;
  }

  if (msg.type === 'AUDIT_POLICY_DIRECT') {
    const state = tabSessions.get(msg.tabId);
    if (!state || !state.policyUrl) {
      sendResponse({ success: false, reason: 'No policy URL detected.' });
      return true;
    }

    fetch(state.policyUrl)
      .then((res) => res.text())
      .then((html) => {
        const text = html.replace(/<[^>]*>/g, ' ');
        const claims = [];

        if (/tailored|targeted|behavioral|retargeting/i.test(text)) {
          claims.push({ category: 'advertising_targeting', claimText: 'Discloses targeted behavioral advertising' });
        }
        if (/we\s+do\s+not\s+sell/i.test(text)) {
          claims.push({ category: 'data_sale', claimText: 'Claims not to sell personal data' });
        }
        if (/GDPR|CCPA|right\s+to\s+access/i.test(text)) {
          claims.push({ category: 'user_rights', claimText: 'Discloses user access and deletion rights' });
        }

        state.policyClaims = claims;
        const assessment = calculateScore(state.events, state.cookies, state.storage, state.policyClaims, true);
        state.score = assessment.score;
        state.findings = assessment.findings;

        sendResponse({ success: true, policyClaims: state.policyClaims, score: state.score, findings: state.findings });
      })
      .catch((err) => {
        sendResponse({ success: false, reason: String(err) });
      });

    return true;
  }

  if (msg.type === 'COPILOT_QUERY') {
    const state = tabSessions.get(msg.tabId);
    const q = (msg.question || '').toLowerCase();
    if (!state) {
      sendResponse({ answer: 'No active session observed.' });
      return true;
    }

    let answer = '';
    const trackers = Array.from(new Set(state.events.filter((e) => e.trackerMatch).map((e) => e.trackerOwner || e.destinationDomain)));

    if (q.includes('score') || q.includes('why') || q.includes('grade')) {
      answer = `PRIVACYLENS gave \`${state.domain}\` a Privacy Score of **${state.score?.overallPrivacyScore ?? 50}/100 (Grade ${state.score?.grade ?? 'C'})**.\n\n` +
        `• **Tracking Exposure**: ${state.score?.trackingExposure ?? 0}/100 (${trackers.length} trackers detected)\n` +
        `• **Cookie Exposure**: ${state.score?.cookieExposure ?? 0}/100 (${state.cookies.length} total cookies, ${state.cookies.filter(c => c.isThirdParty).length} third-party)\n` +
        `• **Reality Gap**: ${state.score?.disclosureConcerns ?? 0}/100\n\n` +
        `Calculated deterministically using: R = 0.35T + 0.25C + 0.15P + 0.25D.`;
    } else if (q.includes('facebook') || q.includes('meta') || q.includes('pixel') || q.includes('ad')) {
      const ads = state.events.filter((e) => e.trackerMatch && (e.trackerCategory === 'advertising' || e.trackerOwner?.includes('Meta')));
      if (ads.length) {
        answer = `Observed **${ads.length}** ad network requests on this page:\n` +
          Array.from(new Set(ads.map((e) => `• **${e.trackerOwner || e.destinationDomain}** (${e.destinationDomain})`))).join('\n') +
          `\n\nThese scripts synchronize cross-site IDs and track catalog views.`;
      } else {
        answer = `No active Meta Pixel or ad network beacons were observed in this session on \`${state.domain}\`.`;
      }
    } else if (q.includes('session') || q.includes('clarity') || q.includes('record') || q.includes('hotjar')) {
      const fp = state.events.filter((e) => e.trackerCategory === 'fingerprinting');
      if (fp.length) {
        answer = `⚠️ **Session Replay Active**: Discovered **${fp[0].trackerOwner || fp[0].destinationDomain}** (${fp[0].destinationDomain}). This technology continuously records mouse movements, clicks, and page scroll playback.`;
      } else {
        answer = `No active session recording (e.g. Clarity, Hotjar) or DOM replay scripts observed on \`${state.domain}\`.`;
      }
    } else {
      answer = `PRIVACYLENS observed **${state.events.length}** requests and **${trackers.length}** trackers for \`${state.domain}\`.\n\nAsk: "Why Grade ${state.score?.grade}?", "Is session recording active?", or "Are advertising trackers running?"`;
    }

    sendResponse({ answer });
    return true;
  }

  return false;
});
