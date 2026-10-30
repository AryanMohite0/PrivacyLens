/**
 * PRIVACYLENS — Content Script
 * Safe isolated client-side storage, cookie, and policy link inspector.
 */

(function () {
  function inspectLocalStorage() {
    const keys = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;

        let isHighEntropy = false;
        try {
          const val = window.localStorage.getItem(key) || '';
          if (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) ||
            (/^[a-f0-9]{32,64}$/i.test(val) && val.length >= 32) ||
            key.includes('fbp') ||
            key.includes('ga_') ||
            key.includes('uid') ||
            key.includes('device_id')
          ) {
            isHighEntropy = true;
          }
        } catch (_) {}

        keys.push({ key, isHighEntropy });
      }
    } catch (_) {}
    return keys;
  }

  function discoverPolicyUrl() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    for (const link of links) {
      const text = (link.textContent || '').trim().toLowerCase();
      const href = link.getAttribute('href') || '';
      if (
        text.includes('privacy policy') ||
        text.includes('privacy notice') ||
        text.includes('data privacy') ||
        href.toLowerCase().includes('privacy-policy') ||
        href.toLowerCase().includes('/privacy')
      ) {
        try {
          return new URL(href, window.location.href).toString();
        } catch (_) {
          return href;
        }
      }
    }
    return null;
  }

  function report() {
    const storage = inspectLocalStorage();
    const policyUrl = discoverPolicyUrl();

    chrome.runtime.sendMessage({
      type: 'CONTENT_OBSERVATION',
      storage,
      policyUrl,
    });
  }

  if (document.readyState === 'complete') {
    report();
  } else {
    window.addEventListener('load', report);
  }
})();

