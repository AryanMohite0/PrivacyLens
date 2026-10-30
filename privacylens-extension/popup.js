/**
 * PRIVACYLENS — Popup Controller
 * Real-time dynamic reactive UI rendering telemetry, score, reality gap, and copilot.
 */

(function () {
  const $ = (id) => document.getElementById(id);

  let currentTabId = null;
  let activeTabKey = 'overview';
  let streamFilter = 'all';
  let streamSearch = '';
  let toastTimer = null;

  let state = {
    domain: 'Detecting...',
    events: [],
    cookies: [],
    storage: [],
    findings: [],
    score: null,
    blockingEnabled: false,
    policyUrl: null,
    trackersCount: 0,
  };

  function showToast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // -------------------------------------------------------------
  // 1. Render Methods
  // -------------------------------------------------------------
  function renderHeader() {
    $('active-domain').textContent = state.domain || 'Active Website';
    $('requests-badge').textContent = `${state.events.length} events`;
    $('stream-count').textContent = state.events.length;
    $('trackers-count').textContent = state.trackersCount;

    const guardBtn = $('guard-toggle');
    if (state.blockingEnabled) {
      guardBtn.textContent = 'GUARD ON';
      guardBtn.classList.add('active');
    } else {
      guardBtn.textContent = 'GUARD OFF';
      guardBtn.classList.remove('active');
    }
  }

  function renderScore() {
    if (!state.score) return;

    $('score-number').textContent = Math.round(state.score.overallPrivacyScore);
    $('t-score').textContent = Math.round(state.score.trackingExposure);
    $('c-score').textContent = Math.round(state.score.cookieExposure);
    $('p-score').textContent = Math.round(state.score.permissionExposure);
    $('d-score').textContent = Math.round(state.score.disclosureConcerns);

    $('score-bar').style.width = `${state.score.overallPrivacyScore}%`;

    const gradeEl = $('grade-badge');
    gradeEl.textContent = `Grade ${state.score.grade}`;
    gradeEl.className = `grade-badge grade-${state.score.grade.toLowerCase()}`;
  }

  function renderFindings() {
    const list = $('findings-list');
    $('findings-count').textContent = `${state.findings.length} observed`;

    if (!state.findings.length) {
      list.innerHTML = '<div class="empty-state">No critical surveillance anomalies captured.</div>';
      return;
    }

    list.innerHTML = state.findings
      .map(
        (f) => `
      <div class="finding-card">
        <div class="finding-header">
          <span class="finding-title">${f.title}</span>
          <span class="finding-sev ${f.severity}">${f.severity}</span>
        </div>
        <div class="finding-desc">${f.observed}</div>
        <div class="finding-ref">Ref: ${(f.references || []).join(', ')}</div>
      </div>
    `
      )
      .join('');
  }

  function renderStream() {
    const list = $('stream-log');
    const filtered = state.events.filter((e) => {
      if (streamFilter !== 'all' && e.trackerCategory !== streamFilter) return false;
      if (streamSearch && !e.destinationDomain.toLowerCase().includes(streamSearch.toLowerCase())) return false;
      return true;
    });

    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">No matching network requests.</div>';
      return;
    }

    list.innerHTML = filtered
      .map(
        (e) => `
      <div class="stream-item">
        <div class="stream-item-top">
          <span class="stream-host">${e.destinationDomain}</span>
          <span class="stream-type">${e.resourceType}</span>
        </div>
        <div class="stream-meta">
          <span class="stream-tag tag-${e.trackerCategory}">${e.trackerOwner || (e.trackerMatch ? e.trackerCategory : 'First-Party')}</span>
          <span class="sanitized-tag">Params Redacted</span>
        </div>
      </div>
    `
      )
      .join('');
  }

  function renderTrackers() {
    const container = $('trackers-tree');
    const matched = state.events.filter((e) => e.trackerMatch);

    if (!matched.length) {
      container.innerHTML = '<div class="empty-state">No third-party trackers detected on this website.</div>';
      return;
    }

    const byOwner = new Map();
    for (const e of matched) {
      const owner = e.trackerOwner || 'Other Trackers';
      if (!byOwner.has(owner)) byOwner.set(owner, []);
      byOwner.get(owner).push(e);
    }

    container.innerHTML = Array.from(byOwner.entries())
      .map(([owner, items]) => {
        const topItem = items[0];
        const domains = Array.from(new Set(items.map((i) => i.destinationDomain)));
        return `
        <div class="tracker-group">
          <div class="tracker-group-head">
            <span class="tracker-company">${owner}</span>
            <span class="tracker-cat-pill cat-${topItem.trackerCategory}">${topItem.trackerCategory}</span>
          </div>
          <div class="tracker-item-sub">
            <span class="tracker-sub-name">${domains.join(', ')}</span>
            <span class="tracker-sub-desc">${topItem.description || 'Observed cross-site tracking activity.'}</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  function renderPolicy() {
    $('policy-url-display').textContent = state.policyUrl || 'No privacy policy link detected in DOM';

    const list = $('gap-findings-list');
    const discrepancies = state.findings.filter((f) => f.id.startsWith('gap-') || f.id === 'no-policy');

    if (!discrepancies.length) {
      list.innerHTML = '<div class="empty-state">No policy reality gaps identified yet. Click audit above to inspect.</div>';
      return;
    }

    list.innerHTML = discrepancies
      .map(
        (f) => `
      <div class="finding-card">
        <div class="finding-header">
          <span class="finding-title" style="color: var(--danger);">${f.title}</span>
          <span class="finding-sev high">Discrepancy</span>
        </div>
        <div class="finding-desc"><strong>Observed:</strong> ${f.observed}</div>
        <div class="finding-desc"><strong>Claim:</strong> ${f.claim}</div>
      </div>
    `
      )
      .join('');
  }

  function renderVault() {
    const cookiesList = $('vault-cookies');
    $('vault-cookie-count').textContent = `${state.cookies.length} cookies`;

    if (!state.cookies.length) {
      cookiesList.innerHTML = '<div class="empty-state">No client cookies observed.</div>';
    } else {
      cookiesList.innerHTML = state.cookies
        .map(
          (c) => `
        <div class="vault-item">
          <span class="vault-item-name">${c.name}</span>
          <span class="vault-item-badge ${!c.isSecure ? 'warning' : ''}">
            ${c.isSecure ? 'Secure SSL' : '⚠️ Insecure HTTP'}
          </span>
        </div>
      `
        )
        .join('');
    }

    const storageList = $('vault-storage');
    $('vault-storage-count').textContent = `${state.storage.length} keys`;

    if (!state.storage.length) {
      storageList.innerHTML = '<div class="empty-state">No LocalStorage keys found.</div>';
    } else {
      storageList.innerHTML = state.storage
        .map(
          (s) => `
        <div class="vault-item">
          <span class="vault-item-name">${s.key}</span>
          <span class="vault-item-badge ${s.isHighEntropy ? 'warning' : ''}">
            ${s.isHighEntropy ? 'High-Entropy ID' : 'Standard Key'}
          </span>
        </div>
      `
        )
        .join('');
    }
  }

  function renderAll() {
    renderHeader();
    renderScore();
    renderFindings();
    renderStream();
    renderTrackers();
    renderPolicy();
    renderVault();
  }

  // -------------------------------------------------------------
  // 2. Tab Navigation
  // -------------------------------------------------------------
  document.querySelectorAll('.nav-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      activeTabKey = tabBtn.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b === tabBtn));
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `panel-${activeTabKey}`);
      });
    });
  });

  // Stream filters
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      streamFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderStream();
    });
  });

  const searchInput = $('stream-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      streamSearch = e.target.value;
      renderStream();
    });
  }

  // -------------------------------------------------------------
  // 3. Actions: Guard Toggle, Rescan, Policy Audit
  // -------------------------------------------------------------
  $('guard-toggle').addEventListener('click', () => {
    const next = !state.blockingEnabled;
    state.blockingEnabled = next;
    renderHeader();

    if (currentTabId) {
      chrome.runtime.sendMessage({ type: 'TOGGLE_GUARD', tabId: currentTabId, enabled: next }, (res) => {
        showToast(next ? 'Tracker Guard Enabled (Ad & Tracking Blocked)' : 'Tracker Guard Disabled');
      });
    }
  });

  $('rescan-btn').addEventListener('click', () => {
    fetchState();
    showToast('Page Telemetry Refreshed');
  });

  $('audit-policy-btn').addEventListener('click', () => {
    if (!currentTabId) return;
    const btn = $('audit-policy-btn');
    btn.textContent = 'Auditing Policy Disclosures...';

    chrome.runtime.sendMessage({ type: 'AUDIT_POLICY_DIRECT', tabId: currentTabId }, (res) => {
      btn.innerHTML = '<span>Run Policy Reality Gap Audit</span><span>↗</span>';
      if (res && res.success) {
        state.policyClaims = res.policyClaims || [];
        if (res.score) state.score = res.score;
        if (res.findings) state.findings = res.findings;
        renderScore();
        renderFindings();
        renderPolicy();
        showToast('Reality Gap Audit Completed');
      } else {
        showToast(res?.reason || 'Could not fetch policy');
      }
    });
  });

  // -------------------------------------------------------------
  // 4. In-Extension Copilot Chat
  // -------------------------------------------------------------
  function appendChat(role, text) {
    const chat = $('copilot-chat');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function askCopilot(question) {
    if (!question.trim()) return;
    appendChat('user', question);

    if (currentTabId) {
      chrome.runtime.sendMessage({ type: 'COPILOT_QUERY', tabId: currentTabId, question }, (res) => {
        appendChat('assistant', res?.answer || 'Telemetry verified.');
      });
    }
  }

  $('copilot-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('copilot-input');
    const val = input.value;
    input.value = '';
    askCopilot(val);
  });

  document.querySelectorAll('.prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      askCopilot(chip.dataset.q);
    });
  });

  // -------------------------------------------------------------
  // 5. Connect to Active Tab & Listen for Real-Time Events
  // -------------------------------------------------------------
  function fetchState() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) return;
      currentTabId = activeTab.id;

      chrome.runtime.sendMessage({ type: 'GET_STATE', tabId: activeTab.id }, (res) => {
        if (res && res.active) {
          state = {
            domain: res.domain,
            events: res.events || [],
            cookies: res.cookies || [],
            storage: res.storage || [],
            findings: res.findings || [],
            score: res.score || null,
            blockingEnabled: res.blockingEnabled || false,
            policyUrl: res.policyUrl || null,
            trackersCount: res.trackersCount || 0,
          };
          renderAll();
        }
      });
    });
  }

  // Real-time dynamic push updates from background service worker
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'REALTIME_TELEMETRY' && (!currentTabId || msg.tabId === currentTabId)) {
      state.events.unshift(msg.event);
      if (state.events.length > 250) state.events.pop();
      if (msg.score) state.score = msg.score;
      if (msg.findings) state.findings = msg.findings;
      if (msg.trackersCount !== undefined) state.trackersCount = msg.trackersCount;

      renderHeader();
      renderScore();
      renderFindings();
      if (activeTabKey === 'stream') renderStream();
      if (activeTabKey === 'trackers') renderTrackers();
    }
  });

  fetchState();
})();
