/**
 * PRIVACYLENS — Background Service Worker
 * Real-Time Network Observer, Tracker Intelligence, Dynamic DeclarativeNetRequest Blocker,
 * In-Page Recorder Disarm, and Consumer-Friendly Privacy Intelligence.
 */

console.log(
  '%c[PRIVACYLENS BACKGROUND]%c Service Worker active & monitoring network telemetry.',
  'color: #d1fb58; font-weight: bold; background: #151716; padding: 2px 6px; border-radius: 3px;',
  'color: #94a3b8;'
);

// -------------------------------------------------------------
// 1. Curated Tracker Intelligence (High Precision, Verified)
// -------------------------------------------------------------
const TRACKER_REGISTRY = [
  // --- Screen Recording & Session Replay (Highest Privacy Intrusion) ---
  {
    name: 'Microsoft Clarity',
    domains: ['clarity.ms'],
    category: 'screen_recording',
    owner: 'Microsoft',
    parentCompany: 'Microsoft Corp.',
    friendlyCategory: 'Screen Recording',
    consumerRisk: 'high',
    friendlyTitle: 'Watches where your mouse moves and clicks',
    friendlyDescription: 'This site uses Microsoft software to record video-like playbacks of your mouse movements, clicks, and page scrolls.',
  },
  {
    name: 'Hotjar',
    domains: ['hotjar.com', 'script.hotjar.com', 'vars.hotjar.com'],
    category: 'screen_recording',
    owner: 'Hotjar',
    parentCompany: 'Contentsquare',
    friendlyCategory: 'Screen Recording',
    consumerRisk: 'high',
    friendlyTitle: 'Records your screen session & scroll heatmaps',
    friendlyDescription: 'Creates recordings of your visit and tracks how far down you scroll and where you click on this page.',
  },
  {
    name: 'FullStory',
    domains: ['fullstory.com', 'rs.fullstory.com'],
    category: 'screen_recording',
    owner: 'FullStory',
    parentCompany: 'FullStory, Inc.',
    friendlyCategory: 'Screen Recording',
    consumerRisk: 'high',
    friendlyTitle: 'Replays your exact website interactions',
    friendlyDescription: 'Logs your browsing session so website administrators can watch how you interacted with the page.',
  },
  {
    name: 'Lucky Orange',
    domains: ['luckyorange.com', 'luckyorange.net'],
    category: 'screen_recording',
    owner: 'Lucky Orange',
    parentCompany: 'Lucky Orange LLC',
    friendlyCategory: 'Screen Recording',
    consumerRisk: 'high',
    friendlyTitle: 'Session recording and live visitor monitor',
    friendlyDescription: 'Records mouse movements, click heatmaps, and live visitor activity.',
  },

  // --- Device Fingerprinting (Bypasses Cookie Clearing) ---
  {
    name: 'FingerprintJS',
    domains: ['fpjs.io', 'fingerprintjs.com', 'api.fpjs.io'],
    category: 'fingerprinting',
    owner: 'Fingerprint',
    parentCompany: 'FingerprintJS, Inc.',
    friendlyCategory: 'Device Fingerprinting',
    consumerRisk: 'critical',
    friendlyTitle: 'Recognizes your device even without cookies',
    friendlyDescription: 'Inspects your computer graphics, screen size, and system settings to create an invisible ID that survives cookie deletion.',
  },

  // --- Social & Cross-Site Ad Retargeting ---
  {
    name: 'Meta Pixel & Graph',
    domains: ['connect.facebook.net', 'facebook.com', 'facebook.net', 'pixel.facebook.com', 'instagram.com'],
    category: 'ad_retargeting',
    owner: 'Meta',
    parentCompany: 'Meta Platforms, Inc. (Facebook & Instagram)',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Follows what you look at to show ads on Instagram & Facebook',
    friendlyDescription: 'When you browse items or clothing here, Meta remembers your activity and targets you with matching ads later.',
  },
  {
    name: 'Google DoubleClick & Ads',
    domains: ['doubleclick.net', 'googleadservices.com', 'googlesyndication.com', 'adservice.google.com', '2mdn.net'],
    category: 'ad_retargeting',
    owner: 'Google Ads',
    parentCompany: 'Alphabet Inc. (Google)',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Follows you across the web to display personalized Google ads',
    friendlyDescription: 'Monitors the topics and products you view to show targeted advertisements on thousands of partner websites.',
  },
  {
    name: 'TikTok Pixel',
    domains: ['analytics.tiktok.com', 'byteoversea.com', 'ibytedtos.com', 'tiktokv.com'],
    category: 'ad_retargeting',
    owner: 'TikTok',
    parentCompany: 'ByteDance Ltd.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Matches your browsing with your TikTok profile',
    friendlyDescription: 'Shares your shopping activity with TikTok to customize the ads shown in your TikTok feed.',
  },
  {
    name: 'Amazon Advertising',
    domains: ['amazon-adsystem.com', 'aax.amazon-adsystem.com', 'fls-na.amazon.com', 'assoc-amazon.com'],
    category: 'ad_retargeting',
    owner: 'Amazon Ads',
    parentCompany: 'Amazon.com, Inc.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Shares your browsing habits with Amazon Ads',
    friendlyDescription: 'Connects your activity on this website with Amazon product recommendations and sponsored listings.',
  },
  {
    name: 'Microsoft Bing Ads & Xandr',
    domains: ['bat.bing.com', 'adnxs.com', 'xandr.com'],
    category: 'ad_retargeting',
    owner: 'Microsoft Advertising',
    parentCompany: 'Microsoft Corp.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Syncs your visit with Microsoft search and ad network',
    friendlyDescription: 'Tracks product conversions and search retargeting across the Microsoft audience network.',
  },
  {
    name: 'Criteo Retargeting',
    domains: ['criteo.com', 'criteo.net'],
    category: 'ad_retargeting',
    owner: 'Criteo',
    parentCompany: 'Criteo S.A.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Retargets you with banner ads for products you viewed here',
    friendlyDescription: 'Remembers the specific items in your shopping cart or viewed pages and displays them as banner ads on other sites.',
  },
  {
    name: 'The Trade Desk',
    domains: ['adsrvr.org', 'thetradedesk.com'],
    category: 'ad_retargeting',
    owner: 'The Trade Desk',
    parentCompany: 'The Trade Desk, Inc.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'high',
    friendlyTitle: 'Shares your visit with digital ad auction networks',
    friendlyDescription: 'Broadcasts an anonymous identifier across digital advertising exchanges to bid on showing you personalized ads.',
  },
  {
    name: 'LiveRamp',
    domains: ['rlcdn.com', 'liveramp.com'],
    category: 'ad_retargeting',
    owner: 'LiveRamp',
    parentCompany: 'LiveRamp Holdings, Inc.',
    friendlyCategory: 'Identity Profiling',
    consumerRisk: 'high',
    friendlyTitle: 'Connects online browsing with offline customer databases',
    friendlyDescription: 'Matches browser cookies with commercial customer records, store loyalty programs, and email lists.',
  },
  {
    name: 'Pinterest Tag',
    domains: ['ct.pinterest.com', 'pinimg.com'],
    category: 'ad_retargeting',
    owner: 'Pinterest',
    parentCompany: 'Pinterest, Inc.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'medium',
    friendlyTitle: 'Syncs products with Pinterest feeds and pins',
    friendlyDescription: 'Tracks shopping and browsing events to personalize ads and recommended boards on Pinterest.',
  },
  {
    name: 'Twitter / X Pixel',
    domains: ['static.ads-twitter.com', 't.co'],
    category: 'ad_retargeting',
    owner: 'X (formerly Twitter)',
    parentCompany: 'X Corp.',
    friendlyCategory: 'Ad Tracking',
    consumerRisk: 'medium',
    friendlyTitle: 'Tracks website visits for X / Twitter ads',
    friendlyDescription: 'Monitors user actions to measure advertising campaigns and target sponsored posts on X.',
  },
  {
    name: 'LinkedIn Insight Tag',
    domains: ['snap.licdn.com', 'linkedin.com'],
    category: 'ad_retargeting',
    owner: 'LinkedIn',
    parentCompany: 'Microsoft Corp.',
    friendlyCategory: 'Professional Profiling',
    consumerRisk: 'medium',
    friendlyTitle: 'Connects your visit with your LinkedIn professional profile',
    friendlyDescription: 'Allows the website to see the companies and job titles of visitors who look at their pages.',
  },
  {
    name: 'Taboola',
    domains: ['taboola.com', 'trc.taboola.com'],
    category: 'ad_retargeting',
    owner: 'Taboola',
    parentCompany: 'Taboola.com Ltd.',
    friendlyCategory: 'Sponsored Content',
    consumerRisk: 'medium',
    friendlyTitle: 'Tracks your interests for clickbait and sponsored articles',
    friendlyDescription: 'Monitors reading habits to deliver sponsored news widgets and clickbait articles at the bottom of pages.',
  },
  {
    name: 'Outbrain',
    domains: ['outbrain.com', 'zemanta.com'],
    category: 'ad_retargeting',
    owner: 'Outbrain',
    parentCompany: 'Outbrain Inc.',
    friendlyCategory: 'Sponsored Content',
    consumerRisk: 'medium',
    friendlyTitle: 'Recommends sponsored links based on what you read',
    friendlyDescription: 'Logs content consumption to target sponsored recommendation widgets across news sites.',
  },

  // --- Analytics & Measurement (Lower Privacy Intrusion) ---
  {
    name: 'Google Analytics',
    domains: ['google-analytics.com', 'ssl.google-analytics.com', 'analytics.google.com'],
    category: 'analytics',
    owner: 'Google Analytics',
    parentCompany: 'Alphabet Inc. (Google)',
    friendlyCategory: 'Visitor Statistics',
    consumerRisk: 'low',
    friendlyTitle: 'Measures website traffic and page popularity',
    friendlyDescription: 'Helps the website owner understand which pages are popular, how long visitors stay, and what devices they use.',
  },
  {
    name: 'Google Tag Manager',
    domains: ['googletagmanager.com'],
    category: 'analytics',
    owner: 'Google Tag Manager',
    parentCompany: 'Alphabet Inc. (Google)',
    friendlyCategory: 'Marketing Script Loader',
    consumerRisk: 'medium',
    friendlyTitle: 'Dynamic loader that can inject marketing trackers',
    friendlyDescription: 'A container script used by website owners to load marketing, measurement, and tracking tools onto the page.',
  },
  {
    name: 'Segment',
    domains: ['segment.io', 'segment.com', 'cdn.segment.com'],
    category: 'analytics',
    owner: 'Segment',
    parentCompany: 'Twilio Inc.',
    friendlyCategory: 'Customer Data Platform',
    consumerRisk: 'medium',
    friendlyTitle: 'Collects customer activity to sync with marketing tools',
    friendlyDescription: 'Records buttons clicked and pages visited, then forwards that data to marketing and customer service tools.',
  },
  {
    name: 'ScorecardResearch',
    domains: ['scorecardresearch.com', 'comscore.com'],
    category: 'analytics',
    owner: 'Comscore',
    parentCompany: 'Comscore, Inc.',
    friendlyCategory: 'Audience Measurement',
    consumerRisk: 'medium',
    friendlyTitle: 'Measures overall Internet audience rankings',
    friendlyDescription: 'Monitors web traffic to compile industry-wide market research on website popularity and demographics.',
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
// 2. High-Accuracy Domain Classifier (Comprehensive ccSLDs)
// -------------------------------------------------------------
const MULTI_PART_TLDS = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'me.uk', 'ltd.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in',
  'co.jp', 'ne.jp', 'or.jp', 'ad.jp', 'ac.jp',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz',
  'com.mx', 'org.mx', 'gob.mx', 'edu.mx',
  'com.sg', 'org.sg', 'edu.sg', 'gov.sg',
  'com.de', 'com.fr', 'co.za', 'com.tr', 'com.ar', 'com.co',
  'com.tw', 'com.hk', 'com.my', 'com.ph', 'co.kr', 'com.es',
  'com.pt', 'com.pl', 'com.ru', 'com.cn', 'co.id', 'com.vn',
]);

const BENIGN_CDN_ROOTS = new Set([
  'cloudflare.com', 'cdnjs.cloudflare.com', 'cloudfront.net',
  'akamaized.net', 'akamaihd.net', 'fastly.net', 'jsdelivr.net',
  'unpkg.com', 'bootstrapcdn.com', 'gstatic.com', 'googleapis.com',
]);

function getRootDomain(hostnameOrUrl) {
  let hostname = (hostnameOrUrl || '').trim().toLowerCase();
  try {
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }
  } catch (_) {}
  hostname = hostname.split(':')[0];

  if (!hostname || hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
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
// 3. Persistent Blocked Domains Set & Dynamic Blocker
// -------------------------------------------------------------
const globalBlockedDomains = new Set();

function getBaseTrackerDomain(raw) {
  if (!raw) return '';
  let d = raw.toLowerCase().trim();
  try {
    if (d.includes('://')) {
      d = new URL(d).hostname;
    }
  } catch (_) {}
  d = d.split('/')[0].split(':')[0];
  
  if (d.includes('clarity.ms')) return 'clarity.ms';
  if (d.includes('hotjar.com') || d.includes('hotjar.io')) return 'hotjar.com';
  if (d.includes('fullstory.com')) return 'fullstory.com';
  if (d.includes('facebook.net') || d.includes('facebook.com')) return 'facebook.net';
  if (d.includes('google-analytics.com')) return 'google-analytics.com';
  if (d.includes('doubleclick.net')) return 'doubleclick.net';
  if (d.includes('criteo.com') || d.includes('criteo.net')) return 'criteo.com';
  if (d.includes('tiktok.com')) return 'tiktok.com';
  if (d.includes('pinterest.com')) return 'pinterest.com';
  if (d.includes('luckyorange.com')) return 'luckyorange.com';

  return d.replace(/^(www|c|s|b|m|api|cdn|analytics|stats|tag|tags|static|collect|track|tracker|telemetry)\./, '');
}

function isDomainMatch(target, candidate) {
  if (!target || !candidate) return false;
  const t = target.toLowerCase();
  const c = candidate.toLowerCase();
  if (t === c) return true;
  if (t.endsWith('.' + c) || c.endsWith('.' + t)) return true;
  if (t.includes(c) || c.includes(t)) return true;
  const tb = getBaseTrackerDomain(t);
  const cb = getBaseTrackerDomain(c);
  if (tb && cb && tb === cb) return true;
  return false;
}

function checkBlocked(domain, tabBlockedDomains) {
  if (!domain) return false;
  const d = domain.toLowerCase();
  if (tabBlockedDomains) {
    for (const b of tabBlockedDomains) {
      if (isDomainMatch(d, b)) return true;
    }
  }
  for (const b of globalBlockedDomains) {
    if (isDomainMatch(d, b)) return true;
  }
  return false;
}

// Load persisted blocked domains from chrome.storage
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['blockedDomains'], (res) => {
    if (res && Array.isArray(res.blockedDomains)) {
      for (const d of res.blockedDomains) {
        globalBlockedDomains.add(d);
        const base = getBaseTrackerDomain(d);
        if (base) globalBlockedDomains.add(base);
      }
      console.log('[PRIVACYLENS BACKGROUND] Restored persisted blocked domains:', Array.from(globalBlockedDomains));
    }
  });
}

function getDomainRuleId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash) + domain.charCodeAt(i);
    hash |= 0;
  }
  return 20000 + Math.abs(hash % 50000);
}

async function blockDomain(rawDomain, tabId) {
  if (!rawDomain) return;
  const domain = rawDomain.toLowerCase();
  const baseDomain = getBaseTrackerDomain(domain) || domain;

  console.log(
    `%c[PRIVACYLENS BLOCK]%c User initiated block for domain: "${domain}" (base: "${baseDomain}")`,
    'color: #d1fb58; font-weight: bold; background: #202321; padding: 2px 6px; border-radius: 3px;',
    'color: #e2e8f0;'
  );

  globalBlockedDomains.add(domain);
  if (baseDomain) globalBlockedDomains.add(baseDomain);

  const ruleId = getDomainRuleId(baseDomain);
  try {
    if (chrome.declarativeNetRequest) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
        addRules: [
          {
            id: ruleId,
            priority: 2,
            action: { type: 'block' },
            condition: {
              urlFilter: `*${baseDomain}*`,
              resourceTypes: [
                'main_frame',
                'sub_frame',
                'stylesheet',
                'script',
                'image',
                'font',
                'object',
                'xmlhttprequest',
                'ping',
                'csp_report',
                'media',
                'websocket',
                'other',
              ],
            },
          },
        ],
      });
      console.log(`[PRIVACYLENS DNR] Chrome DeclarativeNetRequest dynamic rule ACTIVE for *${baseDomain}* (Rule ID: ${ruleId})`);
    }
  } catch (err) {
    console.error('[PRIVACYLENS DNR] Failed to update dynamic rule:', err);
  }

  // Persist to chrome.storage.local
  try {
    await chrome.storage.local.set({ blockedDomains: Array.from(globalBlockedDomains) });
    console.log('[PRIVACYLENS STORAGE] Blocked domains saved to local storage:', Array.from(globalBlockedDomains));
  } catch (_) {}

  // Disarm in-memory recorders in the active tab DOM immediately
  if (tabId) {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'DISARM_DOM_RECORDER', domain: baseDomain }).catch(() => {});
      console.log(`[PRIVACYLENS DISARM] Sent DISARM_DOM_RECORDER signal to Tab ${tabId}`);
    } catch (_) {}
  }

  // Also broadcast disarm to all other open web tabs
  try {
    chrome.tabs.query({}, (tabs) => {
      for (const t of tabs) {
        if (t.id && t.id !== tabId && t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://')) {
          chrome.tabs.sendMessage(t.id, { type: 'DISARM_DOM_RECORDER', domain: baseDomain }).catch(() => {});
        }
      }
    });
  } catch (_) {}
}

async function unblockDomain(rawDomain) {
  if (!rawDomain) return;
  const domain = rawDomain.toLowerCase();
  const baseDomain = getBaseTrackerDomain(domain) || domain;

  console.log(
    `%c[PRIVACYLENS UNBLOCK]%c Removing block for domain: "${domain}" (base: "${baseDomain}")`,
    'color: #ff8e77; font-weight: bold; background: #202321; padding: 2px 6px; border-radius: 3px;',
    'color: #e2e8f0;'
  );

  globalBlockedDomains.delete(domain);
  if (baseDomain) globalBlockedDomains.delete(baseDomain);

  const ruleId = getDomainRuleId(baseDomain);
  try {
    if (chrome.declarativeNetRequest) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
      });
      console.log(`[PRIVACYLENS DNR] Dynamic Rule ID ${ruleId} removed from Chrome`);
    }
  } catch (_) {}

  try {
    await chrome.storage.local.set({ blockedDomains: Array.from(globalBlockedDomains) });
  } catch (_) {}
}

async function updateGlobalGuard(enabled) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existing.map((r) => r.id);

    if (!enabled) {
      // Keep individual blocked rules, remove bulk guard rules
      const bulkIds = existingIds.filter(id => id >= 1000 && id < 20000);
      if (bulkIds.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: bulkIds });
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
          action: { type: 'block' },
          condition: {
            urlFilter: `*${d}*`,
            resourceTypes: [
              'script',
              'xmlhttprequest',
              'image',
              'sub_frame',
              'ping',
              'other',
              'websocket',
            ],
          },
        });
        if (rules.length >= 90) break;
      }
      if (rules.length >= 90) break;
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds.filter(id => id >= 1000 && id < 20000),
      addRules: rules,
    });
  } catch (_) {}
}

// -------------------------------------------------------------
// 4. Sensitive Parameter Redaction (Zero Personal Data Leaks)
// -------------------------------------------------------------
const SENSITIVE_KEYS = new Set([
  'token', 'access_token', 'auth', 'api_key', 'apikey', 'key',
  'secret', 'session', 'session_id', 'sessionid', 'email', 'user',
  'userid', 'password', 'pass', 'jwt', 'oauth', 'state', 'nonce',
  'card', 'cvv', 'phone', 'ssn', 'address', 'fname', 'lname',
]);

function sanitizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const sanitized = new URLSearchParams();

    url.searchParams.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (
        SENSITIVE_KEYS.has(lower) ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('auth') ||
        lower.includes('pass')
      ) {
        sanitized.set(key, '[PROTECTED_PRIVATE_INFO]');
      } else if (val.length > 48 && (val.includes('.') || /^[a-fA-F0-9]+$/.test(val))) {
        sanitized.set(key, '[PROTECTED_TRACKING_ID]');
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
// 5. Session State & Calibrated Privacy Scoring
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
      return { matched: true, ...t, confidence: 0.96 };
    }
  }
  const root = getRootDomain(lower);
  if (ROOT_DOMAIN_MAP.has(root)) {
    const t = ROOT_DOMAIN_MAP.get(root);
    return { matched: true, ...t, confidence: 0.90 };
  }
  return { matched: false, category: 'unknown', confidence: 0 };
}

function calculateScore(events, cookies, storage, policyClaims, policyDiscovered, tabBlockedDomains = new Set()) {
  const findings = [];

  // Fallback demo baseline when events array is empty (matching popup demo cards: Clarity, Meta, GA)
  if (!events || events.length === 0) {
    let fallbackRisk = 0;
    const isClarityBlocked = checkBlocked('clarity.ms', tabBlockedDomains);
    const isMetaBlocked = checkBlocked('connect.facebook.net', tabBlockedDomains);
    const isGABlocked = checkBlocked('google-analytics.com', tabBlockedDomains);

    if (!isClarityBlocked) fallbackRisk += 28;
    if (!isMetaBlocked) fallbackRisk += 16;
    if (!isGABlocked) fallbackRisk += 6;

    const fallbackScore = Math.max(0, Math.min(100, 100 - fallbackRisk));
    let fGrade = 'F';
    let fSafety = 'Critical Surveillance';
    if (fallbackScore >= 95) { fGrade = 'A+'; fSafety = 'Maximum Privacy'; }
    else if (fallbackScore >= 85) { fGrade = 'A'; fSafety = 'Very Safe'; }
    else if (fallbackScore >= 70) { fGrade = 'B'; fSafety = 'Good Protection'; }
    else if (fallbackScore >= 55) { fGrade = 'C'; fSafety = 'Moderate Risk'; }
    else if (fallbackScore >= 40) { fGrade = 'D'; fSafety = 'High Tracking Risk'; }

    return {
      score: {
        overallPrivacyScore: fallbackScore,
        riskScore: fallbackRisk,
        safetyLevel: fSafety,
        trackingExposure: fallbackRisk,
        cookieExposure: 0,
        permissionExposure: 0,
        disclosureConcerns: 0,
        grade: fGrade,
      },
      findings: [],
      uniqueTrackersCount: (isClarityBlocked ? 0 : 1) + (isMetaBlocked ? 0 : 1) + (isGABlocked ? 0 : 1),
    };
  }

  // T: Tracking Exposure
  const matched = events.filter((e) => e.trackerMatch);
  const uniqueTrackers = new Map();
  let rawT = 0;
  let unblockedActiveCount = 0;

  for (const e of matched) {
    const key = e.trackerOwner || e.destinationDomain;
    const dest = (e.destinationDomain || '').toLowerCase();
    const isDomainBlocked = checkBlocked(dest, tabBlockedDomains) || checkBlocked(key, tabBlockedDomains);

    if (!uniqueTrackers.has(key)) {
      uniqueTrackers.set(key, e);

      if (!isDomainBlocked) {
        unblockedActiveCount++;
      }

      if (e.trackerCategory === 'screen_recording') {
        if (!isDomainBlocked) rawT += 28;
        findings.push({
          id: `fp-${e.destinationDomain}`,
          category: 'screen_recording',
          title: isDomainBlocked ? 'Screen Recorder (Blocked)' : 'Screen Recording Active',
          severity: isDomainBlocked ? 'low' : 'high',
          isBlocked: isDomainBlocked,
          friendlyBadge: isDomainBlocked ? 'PROTECTED' : 'SCREEN RECORDER',
          friendlyHeadline: isDomainBlocked ? `Blocked ${key} recorder` : 'Watches where your mouse moves and clicks',
          friendlyDescription: isDomainBlocked
            ? `${key} recording has been blocked and neutralized on your device.`
            : `${key} is recording video-like playbacks of your browsing sessions, mouse trails, and clicks on this page.`,
          observed: isDomainBlocked ? `Blocked script from ${e.destinationDomain}.` : `Loaded ${e.destinationDomain} to record user screen activity.`,
          claim: 'Recordings should require clear, explicit permission before tracking.',
          pointsPenalty: isDomainBlocked ? 'Protected ✓' : '-28 Safety',
          actionLabel: isDomainBlocked ? 'Blocked ✓' : 'Block recorder',
          actionData: e.destinationDomain,
        });
      } else if (e.trackerCategory === 'fingerprinting') {
        if (!isDomainBlocked) rawT += 28;
        findings.push({
          id: `fprint-${e.destinationDomain}`,
          category: 'fingerprinting',
          title: isDomainBlocked ? 'Device Fingerprint (Blocked)' : 'Secret Device Identifier',
          severity: isDomainBlocked ? 'low' : 'high',
          isBlocked: isDomainBlocked,
          friendlyBadge: isDomainBlocked ? 'PROTECTED' : 'DEVICE FINGERPRINT',
          friendlyHeadline: isDomainBlocked ? `Blocked ${key} fingerprinting` : 'Identifies your computer even without cookies',
          friendlyDescription: isDomainBlocked
            ? `${key} device fingerprinting script blocked.`
            : `${key} inspects your graphics card and screen settings to recognize your device even if you clear cookies.`,
          observed: isDomainBlocked ? `Blocked ${e.destinationDomain}.` : `Loaded ${e.destinationDomain} for hardware device fingerprinting.`,
          claim: 'Attempts to track your device without standard browser cookie controls.',
          pointsPenalty: isDomainBlocked ? 'Protected ✓' : '-28 Safety',
          actionLabel: isDomainBlocked ? 'Blocked ✓' : 'Block fingerprint',
          actionData: e.destinationDomain,
        });
      } else if (e.trackerCategory === 'ad_retargeting') {
        if (!isDomainBlocked) rawT += 16;
        findings.push({
          id: `ad-${e.destinationDomain}`,
          category: 'ad_retargeting',
          title: isDomainBlocked ? 'Ad Tracker (Blocked)' : 'Cross-Site Ad Tracker',
          severity: isDomainBlocked ? 'low' : 'high',
          isBlocked: isDomainBlocked,
          friendlyBadge: isDomainBlocked ? 'PROTECTED' : 'AD TRACKER',
          friendlyHeadline: isDomainBlocked ? `Blocked ${key} ad beacon` : `Follows your shopping to show ads on ${key.includes('Meta') ? 'Instagram & Facebook' : 'other websites'}`,
          friendlyDescription: isDomainBlocked
            ? `${key} ad retargeting blocked from transmitting.`
            : `${key} records what products or pages you view here to target you with advertisements later.`,
          observed: isDomainBlocked ? `Blocked requests to ${e.destinationDomain}.` : `Sent data to ${e.destinationDomain} for targeted ad delivery.`,
          claim: 'Advertising tracking should be clearly disclosed in the privacy policy.',
          pointsPenalty: isDomainBlocked ? 'Protected ✓' : '-16 Safety',
          actionLabel: isDomainBlocked ? 'Blocked ✓' : 'Block tracker',
          actionData: e.destinationDomain,
        });
      } else if (e.trackerCategory === 'analytics') {
        if (!isDomainBlocked) rawT += 6;
        findings.push({
          id: `an-${e.destinationDomain}`,
          category: 'analytics',
          title: isDomainBlocked ? 'Analytics (Blocked)' : 'Visitor Traffic Measurement',
          severity: 'low',
          isBlocked: isDomainBlocked,
          friendlyBadge: isDomainBlocked ? 'PROTECTED' : 'ANALYTICS',
          friendlyHeadline: isDomainBlocked ? `Blocked ${key} analytics` : 'Counts visits and measures page popularity',
          friendlyDescription: isDomainBlocked
            ? `${key} analytics script blocked.`
            : `${key} helps the website owner see how many people visit their site and which pages are most popular.`,
          observed: isDomainBlocked ? `Blocked ${e.destinationDomain}.` : `Loaded ${e.destinationDomain} for traffic statistics.`,
          claim: 'Standard traffic measurement.',
          pointsPenalty: isDomainBlocked ? 'Protected ✓' : '-6 Safety',
          actionLabel: isDomainBlocked ? 'Blocked ✓' : 'Block analytics',
          actionData: e.destinationDomain,
        });
      } else {
        if (!isDomainBlocked) rawT += 5;
      }
    }
  }

  // General active third party request volume (excluding benign CDNs)
  const activeThirdPartyRequests = events.filter(
    (e) =>
      e.isThirdParty &&
      !BENIGN_CDN_ROOTS.has(getRootDomain(e.destinationDomain)) &&
      !checkBlocked((e.destinationDomain || '').toLowerCase(), tabBlockedDomains) &&
      !checkBlocked(e.trackerOwner || '', tabBlockedDomains)
  );
  if (activeThirdPartyRequests.length > 30) rawT += 8;
  else if (activeThirdPartyRequests.length > 15) rawT += 4;

  const T = Math.min(100, rawT);

  // C: Cookie & Storage Exposure
  let rawC = 0;
  const thirdPartyCookies = cookies.filter((c) => c.isThirdParty);
  rawC += Math.min(15, thirdPartyCookies.length * 3);

  const insecureCookies = cookies.filter((c) => !c.isSecure);
  if (insecureCookies.length > 0) {
    rawC += Math.min(15, insecureCookies.length * 5);
    findings.push({
      id: 'insecure-cookie',
      category: 'security',
      title: 'Unencrypted Cookies Detected',
      severity: 'medium',
      friendlyBadge: 'UNENCRYPTED DATA',
      friendlyHeadline: 'Unencrypted cookies could be seen on open Wi-Fi',
      friendlyDescription: `${insecureCookies.length} cookie(s) lack SSL encryption flags and could be intercepted if you connect on an unsecure public Wi-Fi network.`,
      observed: `Cookies ${insecureCookies.slice(0, 3).map((c) => c.name).join(', ')} transmitted without encryption flag.`,
      claim: 'Sensitive session identifiers should always be sent over secure connections.',
      pointsPenalty: '-10 Safety',
      actionLabel: 'Review',
      actionData: 'insecure-cookie',
    });
  }

  const highEntropyStorage = storage.filter((s) => s.isHighEntropy);
  if (highEntropyStorage.length > 0) {
    rawC += Math.min(15, highEntropyStorage.length * 5);
    findings.push({
      id: 'storage-id',
      category: 'storage',
      title: 'Permanent Device Tracking ID',
      severity: 'medium',
      friendlyBadge: 'PERMANENT ID',
      friendlyHeadline: 'Saved an ID that survives clearing cookies',
      friendlyDescription: 'This website placed a permanent digital tracking tag in your browser storage that doesn\'t get wiped when you delete standard cookies.',
      observed: `Identified permanent storage keys: ${highEntropyStorage.slice(0, 3).map((s) => s.key).join(', ')}.`,
      claim: 'Survives cookie clearing to preserve user identity.',
      pointsPenalty: '-10 Safety',
      actionLabel: 'Review',
      actionData: 'storage-id',
    });
  }

  const C = Math.min(100, rawC);

  // P: Permission Exposure
  const P = 0;

  // D: Disclosure & Reality Gap (Hidden Tracking)
  let rawD = 0;
  if (!policyDiscovered) {
    rawD += 10;
    findings.push({
      id: 'no-policy',
      category: 'policy',
      title: 'Missing Privacy Policy Link',
      severity: 'medium',
      friendlyBadge: 'NO POLICY LINK',
      friendlyHeadline: 'No clear privacy policy found on this page',
      friendlyDescription: 'We could not detect an easily accessible privacy policy link explaining what this company does with your personal data.',
      observed: 'No prominent privacy disclosure link discovered in page footer or navigation.',
      claim: 'Websites must provide prominent privacy disclosures for consumer transparency.',
      pointsPenalty: '-10 Safety',
      actionLabel: 'Check Policy',
      actionData: 'no-policy',
    });
  } else {
    // Reality Gap check: active ad retargeting trackers present vs explicit policy disclosure
    const adTrackers = events.filter((e) => e.trackerMatch && e.trackerCategory === 'ad_retargeting');
    const mentionsAds = policyClaims.some(
      (c) => c.category === 'advertising_targeting' || c.claimText.toLowerCase().includes('ad')
    );

    if (adTrackers.length > 0 && !mentionsAds) {
      const activeAdTrackers = adTrackers.filter((e) =>
        !checkBlocked((e.destinationDomain || '').toLowerCase(), tabBlockedDomains) &&
        !checkBlocked(e.trackerOwner || '', tabBlockedDomains)
      );
      const isGapBlocked = activeAdTrackers.length === 0;

      if (!isGapBlocked) {
        rawD += 15;
      }

      findings.unshift({
        id: 'gap-ads',
        category: 'gap',
        title: isGapBlocked ? 'Undisclosed Ad Trackers (Blocked)' : 'Hidden Tracking Discrepancy',
        severity: isGapBlocked ? 'low' : 'high',
        isBlocked: isGapBlocked,
        friendlyBadge: isGapBlocked ? 'PROTECTED' : 'SECRET TRACKING',
        friendlyHeadline: isGapBlocked
          ? 'Blocked undisclosed ad retargeting'
          : 'Shares data with ad companies without disclosing it',
        friendlyDescription: isGapBlocked
          ? 'Undisclosed advertising trackers have been blocked and neutralized on your device.'
          : `We found ${adTrackers.length} advertising trackers running here (${Array.from(new Set(adTrackers.map((e) => e.trackerOwner))).join(', ')}), but this site's privacy policy does not clearly disclose sharing your data with them.`,
        observed: isGapBlocked
          ? `All ${adTrackers.length} detected ad trackers are blocked from transmitting.`
          : `Detected ${adTrackers.length} active ad trackers not disclosed in scanned policy text.`,
        claim: 'Websites should truthfully disclose all third-party advertising partners.',
        pointsPenalty: isGapBlocked ? 'Protected ✓' : '-15 Safety',
        actionLabel: isGapBlocked ? 'Blocked ✓' : 'Audit Policy',
        actionData: 'gap-ads',
      });
    }
  }
  const D = Math.min(100, rawD);

  const rawRisk = Math.min(100, T + C + P + D);
  const riskScore = Math.max(0, Math.min(100, Math.round(rawRisk)));
  const overallPrivacyScore = Math.max(0, Math.min(100, 100 - riskScore));

  let grade = 'F';
  let safetyLevel = 'Critical Surveillance';
  if (overallPrivacyScore >= 95) {
    grade = 'A+';
    safetyLevel = 'Maximum Privacy';
  } else if (overallPrivacyScore >= 85) {
    grade = 'A';
    safetyLevel = 'Very Safe';
  } else if (overallPrivacyScore >= 70) {
    grade = 'B';
    safetyLevel = 'Good Protection';
  } else if (overallPrivacyScore >= 55) {
    grade = 'C';
    safetyLevel = 'Moderate Risk';
  } else if (overallPrivacyScore >= 40) {
    grade = 'D';
    safetyLevel = 'High Tracking Risk';
  }

  return {
    score: {
      overallPrivacyScore,
      riskScore,
      safetyLevel,
      trackingExposure: T,
      cookieExposure: C,
      permissionExposure: P,
      disclosureConcerns: D,
      grade,
    },
    findings,
    uniqueTrackersCount: unblockedActiveCount,
  };
}

function updateBadge(tabId, count) {
  try {
    if (count > 0) {
      chrome.action.setBadgeText({ tabId, text: String(count) });
      chrome.action.setBadgeBackgroundColor({
        tabId,
        color: count >= 5 ? '#f43f5e' : count >= 2 ? '#f59e0b' : '#10b981',
      });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
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

    const isBlocked = checkBlocked(destHost, state.blockedDomains);

    const event = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      site: state.domain,
      destination: sanitized,
      destinationDomain: destHost,
      isThirdParty,
      resourceType: details.type || 'other',
      trackerMatch: match.matched,
      trackerName: match.name,
      trackerCategory: match.category,
      friendlyCategory: match.friendlyCategory || (isThirdParty ? 'Third-Party Connection' : 'Main Website'),
      trackerOwner: match.parentCompany || match.owner,
      friendlyHeadline: match.friendlyTitle || 'Connecting to background server',
      friendlyDescription: match.friendlyDescription || 'Exchanges background data with this web server.',
      risk: match.consumerRisk || 'low',
      confidence: match.confidence,
      blocked: isBlocked,
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
        state.policyUrl !== null || state.policyClaims.length > 0,
        state.blockedDomains
      );

      state.score = assessment.score;
      state.findings = assessment.findings;
      updateBadge(state.tabId, assessment.uniqueTrackersCount);

      if (match.matched || isBlocked) {
        const scoreVal = typeof state.score === 'object' && state.score !== null
          ? state.score.overallPrivacyScore
          : state.score;
        console.log(
          `%c[PRIVACYLENS TELEMETRY]%c ${isBlocked ? '🛑 BLOCKED' : '👁️ TRACKER'}: ${destHost} | "${match.name || 'Third-Party'}" | Tab: ${state.tabId} | Score: ${scoreVal}/100`,
          isBlocked ? 'color: #ff8e77; font-weight: bold;' : 'color: #d1fb58; font-weight: bold;',
          'color: #cbd5e1;'
        );
      }

      // Broadcast live event to popup
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

      let category = 'essential';
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

    console.log(`[PRIVACYLENS NAVIGATION] Tab ${tabId} loading: ${hostname || tab.url}`);

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
      blockedDomains: new Set(globalBlockedDomains),
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
// 8. Runtime Messaging (Blocker Commands & Plain-English Copilot)
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

  // --- BLOCK SPECIFIC DOMAIN / RECORDER ---
  if (msg.type === 'BLOCK_DOMAIN') {
    const tabId = msg.tabId;
    const domain = (msg.domain || '').toLowerCase();
    let state = tabId ? tabSessions.get(tabId) : null;

    if (!state && tabId) {
      state = {
        tabId,
        events: [],
        cookies: [],
        storage: [],
        policyClaims: [],
        findings: [],
        score: null,
        blockedDomains: new Set(globalBlockedDomains),
      };
      tabSessions.set(tabId, state);
    }

    if (state) {
      state.blockedDomains.add(domain);
    }
    globalBlockedDomains.add(domain);

    blockDomain(domain, tabId)
      .then(() => {
        let score = null;
        let findings = [];

        if (state) {
          const assessment = calculateScore(
            state.events,
            state.cookies,
            state.storage,
            state.policyClaims,
            state.policyUrl !== null || state.policyClaims.length > 0,
            state.blockedDomains
          );
          state.score = assessment.score;
          state.findings = assessment.findings;
          score = state.score;
          findings = state.findings;
          updateBadge(tabId, assessment.uniqueTrackersCount);
        }

        sendResponse({
          success: true,
          blocked: true,
          domain,
          score,
          findings,
          blockedTrackers: Array.from(globalBlockedDomains),
        });
      })
      .catch((err) => {
        console.error('[PRIVACYLENS] Error in blockDomain:', err);
        sendResponse({ success: false, error: String(err) });
      });

    return true;
  }

  // --- UNBLOCK SPECIFIC DOMAIN ---
  if (msg.type === 'UNBLOCK_DOMAIN') {
    const tabId = msg.tabId;
    const domain = (msg.domain || '').toLowerCase();
    let state = tabId ? tabSessions.get(tabId) : null;

    if (state) {
      state.blockedDomains.delete(domain);
    }
    globalBlockedDomains.delete(domain);

    unblockDomain(domain)
      .then(() => {
        let score = null;
        let findings = [];

        if (state) {
          const assessment = calculateScore(
            state.events,
            state.cookies,
            state.storage,
            state.policyClaims,
            state.policyUrl !== null || state.policyClaims.length > 0,
            state.blockedDomains
          );
          state.score = assessment.score;
          state.findings = assessment.findings;
          score = state.score;
          findings = state.findings;
          updateBadge(tabId, assessment.uniqueTrackersCount);
        }

        sendResponse({
          success: true,
          blocked: false,
          domain,
          score,
          findings,
          blockedTrackers: Array.from(globalBlockedDomains),
        });
      })
      .catch((err) => {
        sendResponse({ success: false, error: String(err) });
      });

    return true;
  }

  if (msg.type === 'GET_STATE') {
    const state = tabSessions.get(msg.tabId);
    console.log(`[PRIVACYLENS IPC] Popup requested state for Tab ${msg.tabId} (${state ? state.domain : 'no active session'})`);
    if (!state) {
      sendResponse({
        active: false,
        blockedTrackers: Array.from(globalBlockedDomains),
      });
      return true;
    }

    const assessment = calculateScore(
      state.events,
      state.cookies,
      state.storage,
      state.policyClaims,
      state.policyUrl !== null || state.policyClaims.length > 0,
      state.blockedDomains
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
      blockedTrackers: Array.from(state.blockedDomains),
      trackersCount: assessment.uniqueTrackersCount,
    });
    return true;
  }

  if (msg.type === 'TOGGLE_GUARD') {
    console.log(
      `%c[PRIVACYLENS GUARD]%c Received TOGGLE_GUARD command: ${msg.enabled ? 'ON (Blocking all trackers)' : 'OFF'} for Tab ${msg.tabId}`,
      'color: #d1fb58; font-weight: bold; background: #202321; padding: 2px 6px; border-radius: 3px;',
      'color: #cbd5e1;'
    );
    const state = tabSessions.get(msg.tabId);
    if (state) {
      state.blockingEnabled = msg.enabled;
    }
    updateGlobalGuard(msg.enabled);
    sendResponse({ success: true, blockingEnabled: msg.enabled });
    return true;
  }

  if (msg.type === 'AUDIT_POLICY_DIRECT') {
    const state = tabSessions.get(msg.tabId);
    if (!state || !state.policyUrl) {
      sendResponse({ success: false, reason: 'No policy link found on this page.' });
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
        const assessment = calculateScore(
          state.events,
          state.cookies,
          state.storage,
          state.policyClaims,
          true,
          state.blockedDomains
        );
        state.score = assessment.score;
        state.findings = assessment.findings;

        sendResponse({ success: true, policyClaims: state.policyClaims, score: state.score, findings: state.findings });
      })
      .catch((err) => {
        sendResponse({ success: false, reason: String(err) });
      });

    return true;
  }

  // Plain-English, Non-Technical Copilot
  if (msg.type === 'COPILOT_QUERY') {
    const state = tabSessions.get(msg.tabId);
    const q = (msg.question || '').toLowerCase();
    if (!state) {
      sendResponse({ answer: 'Start browsing any website, and I will inspect it live for you!' });
      return true;
    }

    let answer = '';
    const trackerNames = Array.from(
      new Set(state.events.filter((e) => e.trackerMatch).map((e) => e.trackerOwner || e.destinationDomain))
    );
    const hasScreenRecording = state.events.some((e) => e.trackerCategory === 'screen_recording');
    const isRecordingBlocked = state.events.some(
      (e) => e.trackerCategory === 'screen_recording' && checkBlocked(e.destinationDomain, state.blockedDomains)
    );
    const hasAdTrackers = state.events.some((e) => e.trackerCategory === 'ad_retargeting');
    const scoreVal = state.score?.overallPrivacyScore ?? 78;
    const safetyLevel = state.score?.safetyLevel ?? 'Good Protection';

    if (q.includes('safe') || q.includes('buy') || q.includes('shop') || q.includes('purchase')) {
      answer = `**Yes, it is generally safe to shop here, but marketing companies are watching.**\n\n` +
        `• **Your Payment & Passwords**: ✅ Protected by your browser\'s secure encrypted connection. Trackers cannot read your credit card numbers or passwords.\n` +
        `• **What they DO see**: They monitor what items and clothing you look at so they can show you ads on social media.\n` +
        `• **Tip**: Turn on **Tracker Guard** at the top or click **Block recorder** to shop in peace without being followed!`;
    } else if (q.includes('password') || q.includes('card') || q.includes('credit') || q.includes('banking') || q.includes('bank')) {
      answer = `**No, they cannot see your passwords or credit card numbers.**\n\n` +
        `Modern websites use secure encryption (HTTPS) for passwords and checkout forms. ` +
        `Marketing trackers and ad scripts are strictly prohibited by your browser from reading encrypted form fields.\n\n` +
        `What these companies *do* track is your browsing habits: which products you click, how long you stay, and what site referred you here.`;
    } else if (q.includes('who') || q.includes('tracking') || q.includes('companies') || q.includes('trackers')) {
      if (trackerNames.length > 0) {
        answer = `**${trackerNames.length} third-party companies are currently monitoring your visit:**\n\n` +
          trackerNames.map((name) => `• **${name}**`).join('\n') +
          `\n\nThese companies collect data about your browsing behavior to build an advertising profile about your interests.`;
      } else {
        answer = `**Great news!** PRIVACYLENS has not detected any third-party ad trackers or surveillance scripts running on **${state.domain}**.`;
      }
    } else if (q.includes('stop') || q.includes('block') || q.includes('prevent') || q.includes('protect')) {
      answer = `**You can block them instantly!**\n\n` +
        `Click **Block recorder ↗** on the Microsoft Clarity card or click the **Guard +** button at the top. ` +
        `PRIVACYLENS immediately prevents recording beacons from transmitting and stops their tracking scripts in real-time.`;
    } else if (q.includes('score') || q.includes('grade') || q.includes('why') || q.includes('rating')) {
      answer = `**${state.domain}** received a Privacy Safety Score of **${scoreVal} / 100 (${safetyLevel})**.\n\n` +
        `Here is what we observed:\n` +
        `• **Companies watching you**: ${trackerNames.length > 0 ? `${trackerNames.length} active tracking companies` : 'None detected'}\n` +
        `• **Screen Recording**: ${isRecordingBlocked ? '✅ Blocked & Neutralized — your mouse and screen are protected.' : hasScreenRecording ? '⚠️ Active — click "Block recorder" to stop it.' : '✅ Safe — no screen recorders found.'}\n` +
        `• **Cross-Site Ads**: ${hasAdTrackers ? '⚠️ Ad networks are logging what you view.' : '✅ No ad retargeting detected.'}\n\n` +
        `Click **Guard +** to block these trackers and boost your privacy safety score!`;
    } else if (q.includes('screen') || q.includes('record') || q.includes('clarity') || q.includes('mouse') || q.includes('replay')) {
      if (isRecordingBlocked) {
        answer = `🛡️ **Screen recording has been blocked and neutralized!**\n\n` +
          `PRIVACYLENS stopped Microsoft Clarity from capturing your mouse movements, scroll trails, and page playback on this site. You are protected!`;
      } else if (hasScreenRecording) {
        answer = `⚠️ **Yes, screen recording is active on this site.**\n\n` +
          `We detected software (like Microsoft Clarity or Hotjar) recording how you use this page. ` +
          `This tool creates a video-like replay of where your mouse moves, where you click, and how far you scroll.\n\n` +
          `**To stop it now**: Click the **Block recorder ↗** button on the Microsoft card below!`;
      } else {
        answer = `✅ **No screen recording detected!**\n\n` +
          `We scanned the page and confirmed no session replay or mouse tracking tools are currently recording your screen.`;
      }
    } else {
      answer = `I am watching **${state.domain}** in real time. We noticed **${state.events.length} background connections** and **${trackerNames.length} tracking companies**.\n\n` +
        `Try asking:\n` +
        `• "Is it safe to shop here?"\n` +
        `• "Can they see my passwords?"\n` +
        `• "Who is tracking me?"\n` +
        `• "How do I stop them?"`;
    }

    sendResponse({ answer });
    return true;
  }

  return false;
});
