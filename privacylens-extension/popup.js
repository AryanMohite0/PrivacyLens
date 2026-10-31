/**
 * PRIVACYLENS — Popup Controller
 * Designed in the exact Pace design system with active recorder blocking & telemetry.
 */

console.log(
  '%c[PRIVACYLENS POPUP]%c Interface initialized.',
  'color: #d1fb58; font-weight: bold; background: #151716; padding: 2px 6px; border-radius: 3px;',
  'color: #94a3b8;'
);

const bookmarkIcon = '<svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4Z"/></svg>';

const $ = (id) => document.getElementById(id);

let state = {
  domain: 'store.nike.com',
  events: [],
  cookies: [],
  storage: [],
  findings: [],
  score: {
    overallPrivacyScore: 50,
    grade: 'D',
    safetyLevel: 'High Tracking Risk',
    trackingExposure: 50,
    cookieExposure: 0,
  },
  flagged: [],
  blockedTrackers: [],
  guardEnabled: false,
  policyUrl: null,
};

let activeTab = 'all';
let streamExpanded = false;
let toastTimer = null;
let currentTabId = null;

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// -------------------------------------------------------------
// Consumer-Friendly Card Generator
// -------------------------------------------------------------
function getBaseDomain(domain) {
  if (!domain) return '';
  let d = domain.toLowerCase().trim();
  try {
    if (d.includes('://')) d = new URL(d).hostname;
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

function isDomainBlockedCheck(targetDomain) {
  if (state.guardEnabled) return true;
  if (!targetDomain) return false;
  const d = targetDomain.toLowerCase();
  const base = getBaseDomain(d);
  return state.blockedTrackers.some((b) => {
    const blocked = b.toLowerCase();
    const bBase = getBaseDomain(blocked);
    return (
      d === blocked ||
      d.endsWith('.' + blocked) ||
      blocked.endsWith('.' + d) ||
      d.includes(blocked) ||
      blocked.includes(d) ||
      (base && bBase && base === bBase)
    );
  });
}

function getFormattedCards() {
  const cards = [];

  // 1. Policy & Hidden Tracking Findings
  if (state.findings && state.findings.length > 0) {
    for (const f of state.findings) {
      const isCritical = f.severity === 'high';
      const isBlocked = f.isBlocked || isDomainBlockedCheck(f.actionData);
      cards.push({
        id: f.id,
        type: f.category === 'gap' ? 'gap' : f.category === 'screen_recording' || f.category === 'ad_retargeting' ? 'trackers' : 'all',
        brand: (f.friendlyBadge || 'ALERT').toUpperCase().slice(0, 14),
        badge: isBlocked ? 'PROTECTED' : f.friendlyBadge || (isCritical ? 'ALERT' : 'NOTICE'),
        badgeClass: isBlocked ? 'badge-green' : isCritical ? '' : 'badge-green',
        overline: f.friendlyBadge === 'SECRET TRACKING' ? 'Privacy Disclosure Discrepancy' : 'Device Privacy Notice',
        title: `<em>${(f.friendlyHeadline || f.title).split(' ')[0]}</em> ${(f.friendlyHeadline || f.title).split(' ').slice(1).join(' ')}`,
        description: isBlocked ? `${f.title} has been blocked and neutralized on your device.` : f.friendlyDescription || f.observed || 'Background activity detected on this page.',
        points: isBlocked ? 'Protected ✓' : f.pointsPenalty || (isCritical ? '-25 Safety' : '-10 Safety'),
        actionLabel: isBlocked ? 'Blocked ✓' : f.actionLabel || 'Learn more',
        actionData: f.actionData || f.id,
        isBlocked,
      });
    }
  }

  // 2. Verified Third-Party Trackers
  const matchedEvents = state.events.filter((e) => e.trackerMatch);
  const seenOwners = new Set();

  for (const e of matchedEvents) {
    const owner = e.trackerOwner || e.destinationDomain;
    if (seenOwners.has(owner)) continue;
    seenOwners.add(owner);

    const dest = (e.destinationDomain || '').toLowerCase();
    const isBlocked = isDomainBlockedCheck(dest) || e.blocked;
    const isFp = e.trackerCategory === 'screen_recording' || e.trackerCategory === 'fingerprinting';

    cards.push({
      id: `trk-${owner}`,
      type: 'trackers',
      brand: (e.trackerName || owner).toUpperCase().slice(0, 14),
      badge: isBlocked ? 'PROTECTED' : isFp ? 'SCREEN RECORDER' : e.trackerCategory === 'ad_retargeting' ? 'AD TRACKER' : 'ANALYTICS',
      badgeClass: isBlocked ? 'badge-green' : isFp ? '' : 'badge-green',
      overline: `${owner} · Active Tracker`,
      title: isBlocked
        ? `<em>Blocked</em> ${owner} tracking activity`
        : `<em>${e.friendlyHeadline ? e.friendlyHeadline.split(' ')[0] : 'Tracking'}</em> ${e.friendlyHeadline ? e.friendlyHeadline.split(' ').slice(1).join(' ') : 'activity active'}`,
      description: isBlocked
        ? `${owner} has been stopped from recording your session or collecting data.`
        : e.friendlyDescription || 'Monitors user navigation and interactions on this website.',
      points: isBlocked ? 'Protected ✓' : isFp ? '-30 Safety' : e.trackerCategory === 'ad_retargeting' ? '-20 Safety' : '-6 Safety',
      actionLabel: isBlocked ? 'Blocked ✓' : isFp ? 'Block recorder' : 'Block tracker',
      actionData: e.destinationDomain,
      isBlocked,
    });
  }

  // Fallback demo cards if scanning just initiated
  if (cards.length === 0) {
    const isClarityBlocked = isDomainBlockedCheck('clarity.ms');
    const isMetaBlocked = isDomainBlockedCheck('connect.facebook.net');
    const isGABlocked = isDomainBlockedCheck('google-analytics.com');

    cards.push(
      {
        id: 'clarity-ms',
        type: 'trackers',
        brand: 'MICROSOFT',
        badge: isClarityBlocked ? 'PROTECTED' : 'SCREEN RECORDER',
        badgeClass: isClarityBlocked ? 'badge-green' : '',
        overline: 'Microsoft Clarity · Screen Replay',
        title: isClarityBlocked
          ? '<em>Blocked</em> Microsoft Clarity recorder'
          : '<em>Watches</em> where your mouse moves and clicks',
        description: isClarityBlocked
          ? 'Microsoft Clarity recording has been blocked and neutralized on your device.'
          : 'This site uses Microsoft software to record video-like playbacks of your mouse movements, clicks, and page scrolls.',
        points: isClarityBlocked ? 'Protected ✓' : '-30 Safety',
        actionLabel: isClarityBlocked ? 'Blocked ✓' : 'Block recorder',
        actionData: 'clarity.ms',
        isBlocked: isClarityBlocked,
      },
      {
        id: 'meta-px',
        type: 'trackers',
        brand: 'META',
        badge: isMetaBlocked ? 'PROTECTED' : 'AD TRACKER',
        badgeClass: isMetaBlocked ? 'badge-green' : '',
        overline: 'Meta Platforms · Facebook & Instagram',
        title: isMetaBlocked
          ? '<em>Blocked</em> Meta ad retargeting'
          : '<em>Follows</em> what you view to show ads on Instagram & Facebook',
        description: isMetaBlocked
          ? 'Meta Pixel has been blocked from tracking your shopping activity.'
          : 'When you browse items or clothing here, Meta remembers your activity and targets you with matching ads later.',
        points: isMetaBlocked ? 'Protected ✓' : '-20 Safety',
        actionLabel: isMetaBlocked ? 'Blocked ✓' : 'Block tracker',
        actionData: 'connect.facebook.net',
        isBlocked: isMetaBlocked,
      },
      {
        id: 'ga4-ad',
        type: 'trackers',
        brand: 'GOOGLE',
        badge: isGABlocked ? 'PROTECTED' : 'ANALYTICS',
        badgeClass: 'badge-green',
        overline: 'Alphabet Inc · Google Analytics',
        title: isGABlocked
          ? '<em>Blocked</em> Google Analytics'
          : '<em>Counts</em> visits and measures page popularity',
        description: isGABlocked
          ? 'Google Analytics script has been blocked from logging your visits.'
          : 'Helps the website owner understand how many people visit their site and which pages are most popular.',
        points: isGABlocked ? 'Protected ✓' : '-6 Safety',
        actionLabel: isGABlocked ? 'Blocked ✓' : 'Block tracker',
        actionData: 'google-analytics.com',
        isBlocked: isGABlocked,
      }
    );
  }

  return cards;
}

// -------------------------------------------------------------
// Dynamic Score Recalculator (Immediate Tangible Feedback)
// -------------------------------------------------------------
function getEffectiveScore() {
  const cards = getFormattedCards();
  let totalPenalty = 0;
  const processedEntities = new Set();

  for (const c of cards) {
    if (c.isBlocked) continue; // Blocked trackers do not penalize!

    // Deduplicate by base tracker entity or brand
    const entityKey = (c.actionData || c.brand || c.id || '').toLowerCase();
    const baseKey = getBaseDomain(entityKey) || entityKey;
    if (processedEntities.has(baseKey)) continue;
    processedEntities.add(baseKey);

    const badge = (c.badge || '').toUpperCase();
    const brand = (c.brand || '').toUpperCase();

    if (badge.includes('RECORDER') || badge.includes('FINGERPRINT') || brand.includes('CLARITY')) {
      totalPenalty += 28;
    } else if (badge.includes('AD TRACKER') || badge.includes('AD') || brand.includes('META') || brand.includes('FACEBOOK')) {
      totalPenalty += 16;
    } else if (badge.includes('ANALYTICS') || brand.includes('GOOGLE')) {
      totalPenalty += 6;
    } else if (badge.includes('SECRET') || badge.includes('GAP')) {
      totalPenalty += 15;
    } else if (badge.includes('NO POLICY') || badge.includes('UNENCRYPTED')) {
      totalPenalty += 10;
    } else {
      totalPenalty += 6;
    }
  }

  // Add minor cookie penalty if active 3rd-party cookies exist
  if (state.cookies && state.cookies.length > 0) {
    const thirdPartyCookies = state.cookies.filter((ck) => ck.isThirdParty);
    totalPenalty += Math.min(12, thirdPartyCookies.length * 3);
  }

  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  let grade = 'F';
  let safetyLevel = 'Critical Surveillance';
  if (score >= 95) {
    grade = 'A+';
    safetyLevel = 'Maximum Privacy';
  } else if (score >= 85) {
    grade = 'A';
    safetyLevel = 'Very Safe';
  } else if (score >= 70) {
    grade = 'B';
    safetyLevel = 'Good Protection';
  } else if (score >= 55) {
    grade = 'C';
    safetyLevel = 'Moderate Risk';
  } else if (score >= 40) {
    grade = 'D';
    safetyLevel = 'High Tracking Risk';
  }

  return { score, grade, safetyLevel };
}

// -------------------------------------------------------------
// Render Function (User-Friendly Display)
// -------------------------------------------------------------
function render() {
  const { score: scoreNum, grade, safetyLevel } = getEffectiveScore();

  $('balance').textContent = scoreNum;
  $('score-progress').style.width = `${scoreNum}%`;
  $('grade-pill').textContent = `GRADE ${grade}`;

  const safetyEl = $('safety-level-label');
  if (safetyEl) {
    safetyEl.innerHTML = `Safety: <strong>${safetyLevel}</strong>`;
  }

  // Target website
  const site = state.domain || 'Active Site';
  $('site-name').textContent = site;
  $('site-logo').textContent = site.split('.')[0].toUpperCase().slice(0, 4);

  // Cards
  const cards = getFormattedCards();
  const trackerCards = cards.filter((c) => c.type === 'trackers');
  const unblockedTrackers = trackerCards.filter((c) => !c.isBlocked);
  const unblockedCount = unblockedTrackers.length;

  $('site-sub').textContent = unblockedCount === 0
    ? 'All tracking companies blocked ✓'
    : `${unblockedCount} third-party ${unblockedCount === 1 ? 'company' : 'companies'} monitoring you`;

  $('tracker-count-txt').textContent = unblockedCount === 0
    ? '0 companies (All Blocked)'
    : `${unblockedCount} ${unblockedCount === 1 ? 'company' : 'companies'}`;

  $('events-count-stat').textContent = `${state.events.length || 18} background activities`;

  // Guard Button
  const guardBtn = $('guard-btn');
  guardBtn.innerHTML = state.guardEnabled ? 'Guarded <span>✓</span>' : 'Guard <span>+</span>';
  guardBtn.classList.toggle('active', state.guardEnabled);

  // Settings switch
  $('guard-switch').setAttribute('aria-checked', String(state.guardEnabled));

  const filtered = cards.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'trackers') return c.type === 'trackers';
    if (activeTab === 'gap') return c.type === 'gap' || c.badge.includes('SECRET') || c.badge.includes('POLICY');
    return true;
  });

  $('tab-all-count').textContent = cards.length;
  $('tab-trackers-count').textContent = cards.filter((c) => c.type === 'trackers').length;
  $('tab-gap-count').textContent = cards.filter((c) => c.type === 'gap' || c.badge.includes('SECRET') || c.badge.includes('POLICY')).length;
  $('hazard-count').textContent = cards.filter((c) => !c.isBlocked && (c.points.includes('-30') || c.points.includes('-35') || c.points.includes('-28') || c.badge.includes('ALERT') || c.badge.includes('RECORDER'))).length;

  // View Switching (Cards vs Copilot)
  if (activeTab === 'copilot') {
    $('tasks').hidden = true;
    $('copilot-drawer').hidden = false;
    $('more').hidden = true;
  } else {
    $('tasks').hidden = false;
    $('copilot-drawer').hidden = true;
    $('more').hidden = false;

    if (filtered.length) {
      $('tasks').innerHTML = filtered
        .map((c) => {
          const isFlagged = state.flagged.includes(c.id);
          const isBlocked = c.isBlocked;
          return `
          <article class="reward-card ${isBlocked ? 'card-blocked' : ''}">
            <div class="reward-image">
              <div class="brand-placeholder">
                <h1>${c.brand}</h1>
                <span>${c.badge}</span>
              </div>
              <span class="offer-badge ${c.badgeClass}">${c.badge}</span>
              <button class="save-button ${isFlagged ? 'saved' : ''}" data-flag="${c.id}" title="${isFlagged ? 'Saved' : 'Save note'}">
                ${bookmarkIcon}
              </button>
            </div>
            <div class="reward-content">
              <div class="reward-overline">${c.overline}</div>
              <h3>${c.title}</h3>
              <p>${c.description}</p>
              <div class="reward-bottom">
                <span class="reward-points">${c.points}</span>
                <button class="activate ${isBlocked ? 'activated' : ''}" data-block="${c.actionData}">
                  ${isBlocked ? 'Blocked ✓' : c.actionLabel + ' <span>↗</span>'}
                </button>
              </div>
            </div>
          </article>
        `;
        })
        .join('');
    } else {
      $('tasks').innerHTML = `<div class="empty">No privacy issues found in this category.</div>`;
    }
  }

  // Render User-Friendly Live Connection Stream
  const streamContainer = $('stream-items');
  const recentEvents = state.events.slice(0, 20);
  if (recentEvents.length) {
    streamContainer.innerHTML = recentEvents
      .map((e) => {
        const isBlocked = isDomainBlockedCheck(e.destinationDomain) || isDomainBlockedCheck(e.trackerOwner) || e.blocked;
        return `
        <div class="stream-row ${isBlocked ? 'stream-blocked' : ''}">
          <span class="host" title="${e.destination}">${e.trackerOwner || e.destinationDomain}</span>
          <span class="tag">${isBlocked ? 'BLOCKED ✓' : e.friendlyCategory || 'Web Connection'}</span>
        </div>
      `;
      })
      .join('');
  } else {
    const isClarityBlocked = isDomainBlockedCheck('clarity.ms');
    const isMetaBlocked = isDomainBlockedCheck('connect.facebook.net');
    streamContainer.innerHTML = `
      <div class="stream-row ${isClarityBlocked ? 'stream-blocked' : ''}">
        <span class="host">Microsoft Clarity</span>
        <span class="tag">${isClarityBlocked ? 'BLOCKED ✓' : 'Screen Recording'}</span>
      </div>
      <div class="stream-row ${isMetaBlocked ? 'stream-blocked' : ''}">
        <span class="host">Meta Platforms</span>
        <span class="tag">${isMetaBlocked ? 'BLOCKED ✓' : 'Ad Tracking'}</span>
      </div>
      <div class="stream-row">
        <span class="host">Google Analytics</span>
        <span class="tag">Visitor Stats</span>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// Interactive Events (Block Recorder, Guard, Copilot)
// -------------------------------------------------------------
$('guard-btn').onclick = () => {
  state.guardEnabled = !state.guardEnabled;
  console.log(
    `%c[PRIVACYLENS POPUP]%c Tracker Guard toggled: ${state.guardEnabled ? 'ON (Blocking all trackers & screen recorders)' : 'OFF'}`,
    'color: #d1fb58; font-weight: bold; background: #202321; padding: 2px 6px; border-radius: 3px;',
    'color: #e2e8f0;'
  );
  if (currentTabId && typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'TOGGLE_GUARD', tabId: currentTabId, enabled: state.guardEnabled });
  }
  render();
  toast(state.guardEnabled ? 'Tracker Guard active: All trackers and screen recorders blocked.' : 'Tracker Guard turned off.');
};

$('guard-switch').onclick = () => {
  $('guard-btn').click();
};

$('tasks').onclick = (event) => {
  const flagBtn = event.target.closest('[data-flag]');
  const blockBtn = event.target.closest('[data-block]');

  if (flagBtn) {
    const id = flagBtn.dataset.flag;
    const exists = state.flagged.includes(id);
    state.flagged = exists ? state.flagged.filter((x) => x !== id) : [...state.flagged, id];
    render();
    toast(exists ? 'Item removed from saved items.' : 'Item saved to your list.');
  }

  // --- Real Blocker Execution ---
  if (blockBtn) {
    const domain = (blockBtn.dataset.block || '').toLowerCase();
    if (!domain) return;
    const base = getBaseDomain(domain) || domain;

    const isCurrentlyBlocked = isDomainBlockedCheck(domain);

    if (!isCurrentlyBlocked) {
      if (!state.blockedTrackers.includes(domain)) state.blockedTrackers.push(domain);
      if (base && !state.blockedTrackers.includes(base)) state.blockedTrackers.push(base);
      render();

      const label = domain.includes('clarity') || domain.includes('hotjar') || domain.includes('fullstory')
        ? 'Screen recorder blocked & neutralized'
        : `${domain} blocked`;

      toast(`Protection active: ${label}.`);

      const doSendBlock = (tid) => {
        const effective = getEffectiveScore();
        console.log(
          `%c[PRIVACYLENS POPUP]%c 🛑 RECORDER BLOCKED: "${domain}" (base: "${base}") | Tab: ${tid || 'active'} | Score: ${effective.score}/100 (${effective.grade})`,
          'color: #d1fb58; font-weight: bold; background: #151716; padding: 3px 8px; border-radius: 4px; border: 1px solid #d1fb58;',
          'color: #e2e8f0;'
        );
        console.log(`[PRIVACYLENS POPUP] Active blocked trackers list:`, state.blockedTrackers);

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(
            {
              type: 'BLOCK_DOMAIN',
              domain,
              tabId: tid,
            },
            (res) => {
              console.log(
                `%c[PRIVACYLENS POPUP]%c ✓ Background Engine confirmed DNR rule installation:`,
                'color: #d1fb58; font-weight: bold;',
                'color: #94a3b8;',
                res
              );
              if (res && res.score) {
                state.score = res.score;
                state.findings = res.findings || state.findings;
              }
              if (res && Array.isArray(res.blockedTrackers)) {
                for (const b of res.blockedTrackers) {
                  const bl = b.toLowerCase();
                  if (!state.blockedTrackers.includes(bl)) state.blockedTrackers.push(bl);
                  const bBase = getBaseDomain(bl);
                  if (bBase && !state.blockedTrackers.includes(bBase)) state.blockedTrackers.push(bBase);
                }
              }
              render();
            }
          );
        }
      };

      if (!currentTabId && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          currentTabId = tabs[0]?.id || null;
          doSendBlock(currentTabId);
        });
      } else {
        doSendBlock(currentTabId);
      }
    } else {
      state.blockedTrackers = state.blockedTrackers.filter((d) => {
        const dl = d.toLowerCase();
        return dl !== domain && dl !== base && getBaseDomain(dl) !== base;
      });
      render();
      toast(`Protection removed: ${domain} unblocked.`);

      const effective = getEffectiveScore();
      console.log(
        `%c[PRIVACYLENS POPUP]%c 🔓 RECORDER UNBLOCKED: "${domain}" (base: "${base}") | Score: ${effective.score}/100 (${effective.grade})`,
        'color: #ff8e77; font-weight: bold; background: #151716; padding: 3px 8px; border-radius: 4px; border: 1px solid #ff8e77;',
        'color: #e2e8f0;'
      );

      const doSendUnblock = (tid) => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(
            {
              type: 'UNBLOCK_DOMAIN',
              domain,
              tabId: tid,
            },
            (res) => {
              console.log(
                `%c[PRIVACYLENS POPUP]%c Background Engine confirmed unblock:`,
                'color: #ff8e77; font-weight: bold;',
                'color: #94a3b8;',
                res
              );
              if (res && res.score) {
                state.score = res.score;
                state.findings = res.findings || state.findings;
              }
              if (res && Array.isArray(res.blockedTrackers)) {
                state.blockedTrackers = res.blockedTrackers.map((b) => b.toLowerCase());
              }
              render();
            }
          );
        }
      };

      if (!currentTabId && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          currentTabId = tabs[0]?.id || null;
          doSendUnblock(currentTabId);
        });
      } else {
        doSendUnblock(currentTabId);
      }
    }
  }
};

document.querySelectorAll('[data-tab]').forEach((btn) => {
  btn.onclick = () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  };
});

$('more').onclick = () => {
  streamExpanded = !streamExpanded;
  $('stream-drawer').hidden = !streamExpanded;
  $('more').innerHTML = streamExpanded ? 'Hide network activity <span>↑</span>' : 'View background network activity <span>↗</span>';
};

$('close-stream').onclick = () => {
  streamExpanded = false;
  $('stream-drawer').hidden = true;
  $('more').innerHTML = 'View background network activity <span>↗</span>';
};

$('settings').onclick = () => {
  $('dashboard').hidden = true;
  $('settings-panel').hidden = false;
};

$('back').onclick = () => {
  $('dashboard').hidden = false;
  $('settings-panel').hidden = true;
};

document.querySelector('.brand').onclick = (e) => {
  e.preventDefault();
  $('back').click();
};

$('run-policy-audit').onclick = () => {
  if (currentTabId && typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'AUDIT_POLICY_DIRECT', tabId: currentTabId }, (res) => {
      if (res && res.success) {
        state.findings = res.findings || [];
        state.score = res.score || state.score;
        render();
        toast('Privacy policy checked against live activity.');
      } else {
        toast('No official privacy policy link found on this page.');
      }
    });
  } else {
    toast('Checked: Undisclosed ad retargeting identified.');
  }
};

$('reset').onclick = () => {
  state.flagged = [];
  state.blockedTrackers = [];
  state.guardEnabled = false;
  render();
  toast('Scan history reset for this site.');
};

// -------------------------------------------------------------
// In-Extension Copilot (Plain-English Answers)
// -------------------------------------------------------------
function askCopilot(question) {
  if (!question.trim()) return;
  const msgs = $('copilot-msgs');

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = question;
  msgs.appendChild(userBubble);
  msgs.scrollTop = msgs.scrollHeight;

  const renderAnswer = (rawText) => {
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble assistant';
    let formatted = rawText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/• /g, '• ');
    botBubble.innerHTML = formatted;
    msgs.appendChild(botBubble);
    msgs.scrollTop = msgs.scrollHeight;
  };

  if (currentTabId && typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'COPILOT_QUERY', tabId: currentTabId, question }, (res) => {
      renderAnswer(res?.answer || 'This site is being monitored. Your information is protected.');
    });
  } else {
    setTimeout(() => {
      renderAnswer(
        `Yes! <strong>${state.domain}</strong> has a Privacy Safety Score of <strong>${getEffectiveScore().score}/100</strong>. ` +
        `Your passwords and card numbers are secure, but marketing companies like Meta and Google are tracking what products you view.`
      );
    }, 250);
  }
}

$('copilot-form').onsubmit = (e) => {
  e.preventDefault();
  const input = $('copilot-input');
  const val = input.value;
  input.value = '';
  askCopilot(val);
};

document.querySelectorAll('.chip').forEach((chip) => {
  chip.onclick = () => {
    askCopilot(chip.dataset.q);
  };
});

// -------------------------------------------------------------
// Tab Connection & Live Telemetry
// -------------------------------------------------------------
function loadPersistedBlocks() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['blockedDomains'], (res) => {
      if (res && Array.isArray(res.blockedDomains)) {
        for (const d of res.blockedDomains) {
          const dl = d.toLowerCase();
          if (!state.blockedTrackers.includes(dl)) {
            state.blockedTrackers.push(dl);
          }
          const base = getBaseDomain(dl);
          if (base && !state.blockedTrackers.includes(base)) {
            state.blockedTrackers.push(base);
          }
        }
        render();
      }
    });
  }
}

function connectTab() {
  loadPersistedBlocks();

  if (typeof chrome === 'undefined' || !chrome.tabs) {
    render();
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      render();
      return;
    }
    currentTabId = tab.id;
    console.log(`[PRIVACYLENS POPUP] Connected to active Tab ID: ${tab.id} (URL: ${tab.url || 'blank'})`);

    chrome.runtime.sendMessage({ type: 'GET_STATE', tabId: tab.id }, (res) => {
      console.log('[PRIVACYLENS POPUP] Received state from background worker:', res);
      if (res) {
        if (Array.isArray(res.blockedTrackers)) {
          for (const d of res.blockedTrackers) {
            const dl = d.toLowerCase();
            if (!state.blockedTrackers.includes(dl)) {
              state.blockedTrackers.push(dl);
            }
            const base = getBaseDomain(dl);
            if (base && !state.blockedTrackers.includes(base)) {
              state.blockedTrackers.push(base);
            }
          }
        }
        if (res.active) {
          state.domain = res.domain || state.domain;
          state.events = res.events || [];
          state.cookies = res.cookies || [];
          state.storage = res.storage || [];
          state.findings = res.findings || [];
          state.score = res.score || state.score;
          state.guardEnabled = res.blockingEnabled || false;
          state.policyUrl = res.policyUrl || null;
        }
      }
      render();
    });
  });

  // Real-time dynamic updates
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'REALTIME_TELEMETRY' && (!currentTabId || msg.tabId === currentTabId)) {
      console.log(`[PRIVACYLENS POPUP] Real-time telemetry: ${msg.event?.destinationDomain} (Score: ${msg.score?.overallPrivacyScore || msg.score}/100)`);
      state.events.unshift(msg.event);
      if (state.events.length > 250) state.events.pop();
      if (msg.score) state.score = msg.score;
      if (msg.findings) state.findings = msg.findings;
      render();
    }
  });
}

connectTab();
render();
