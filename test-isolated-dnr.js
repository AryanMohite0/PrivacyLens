const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function testRealBlocking() {
  console.log('======================================================');
  console.log('   PRIVACYLENS — LIVE BLOCKING EXPERIMENT ON CHROME   ');
  console.log('======================================================\n');

  const extPath = path.resolve('privacylens-extension');
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'test-blocking-chrome-'));

  console.log(`[1] Profile dir: ${tempProfile}`);
  console.log(`[2] Extension dir: ${extPath}`);

  // Launch Chrome
  const context = await chromium.launchPersistentContext(tempProfile, {
    channel: 'chrome',
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  console.log('[3] Google Chrome process launched.');

  // Open webpage to trigger content script and wake worker
  const page = await context.newPage();
  console.log('[4] Navigating page to https://example.com ...');
  
  const workerPromise = context.waitForEvent('serviceworker', {
    predicate: w => w.url().startsWith('chrome-extension://'),
    timeout: 7000
  }).catch(() => null);

  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  let worker = await workerPromise;
  if (!worker) {
    const list = context.serviceWorkers();
    worker = list.find(w => w.url().startsWith('chrome-extension://'));
  }

  let extId = null;
  if (worker) {
    extId = worker.url().split('/')[2];
    console.log(`[5] Extension Service Worker active! ID: ${extId}`);
  } else {
    console.log('[!] Worker not caught via event, listing workers:', context.serviceWorkers().map(w => w.url()));
  }

  // TEST PART A: Pre-blocking fetch to clarity.ms
  console.log('\n--- PART A: Pre-blocking network request ---');
  const preFetch = await page.evaluate(async () => {
    try {
      await fetch('https://www.clarity.ms/tag/probe-before', { mode: 'no-cors' });
      return { blocked: false, status: 'ALLOWED' };
    } catch (e) {
      return { blocked: true, error: e.message };
    }
  });
  console.log('[RESULT A] Pre-blocking fetch to clarity.ms:', preFetch);

  // TEST PART B: Execute real blockDomain('clarity.ms')
  console.log('\n--- PART B: Triggering blockDomain("clarity.ms") in extension engine ---');
  let dnrRules = [];
  if (worker) {
    dnrRules = await worker.evaluate(async () => {
      await blockDomain('clarity.ms');
      return await chrome.declarativeNetRequest.getDynamicRules();
    });
    console.log('[RESULT B] DNR rules active in Chrome:', JSON.stringify(dnrRules, null, 2));
  } else if (extId) {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extId}/popup.html`);
    await popup.click('[data-block="clarity.ms"]');
    await new Promise(r => setTimeout(r, 500));
    await popup.close();
  }

  await new Promise(r => setTimeout(r, 600));

  // TEST PART C: Post-blocking fetch to clarity.ms
  console.log('\n--- PART C: Post-blocking network fetch to clarity.ms ---');
  const postFetch = await page.evaluate(async () => {
    try {
      await fetch('https://www.clarity.ms/tag/probe-after', { mode: 'no-cors' });
      return { blocked: false, status: 'ALLOWED_NOT_BLOCKED' };
    } catch (e) {
      return { 
        blocked: true, 
        errorMessage: e.message,
        isBlockedByClient: e.message.includes('Failed to fetch') || e.message.includes('ERR_BLOCKED_BY_CLIENT')
      };
    }
  });
  console.log('[RESULT C] Post-blocking fetch to clarity.ms:', postFetch);

  // TEST PART D: Post-blocking <script src="..."> tag injection
  console.log('\n--- PART D: Post-blocking <script src="https://www.clarity.ms/..."> tag injection ---');
  const scriptTag = await page.evaluate(() => {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://www.clarity.ms/s/0.7.35/clarity.js';
      s.onload = () => resolve({ blocked: false, status: 'SCRIPT_LOADED' });
      s.onerror = () => resolve({ blocked: true, status: 'BLOCKED_BY_BROWSER_DNR' });
      document.head.appendChild(s);
    });
  });
  console.log('[RESULT D] Script tag injection result:', scriptTag);

  // TEST PART E: Test popup UI state
  if (extId) {
    console.log('\n--- PART E: Checking Extension Popup UI in Chrome ---');
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extId}/popup.html`);
    await new Promise(r => setTimeout(r, 600));
    
    const clarityBtnText = await popupPage.locator('[data-block="clarity.ms"]').textContent();
    const scoreVal = await popupPage.locator('#balance').textContent();
    const gradeVal = await popupPage.locator('#grade-pill').textContent();
    console.log(`[RESULT E] Popup Clarity Button: "${clarityBtnText.trim()}"`);
    console.log(`[RESULT E] Popup Score: ${scoreVal} (${gradeVal})`);

    await popupPage.screenshot({ path: 'live_verified_blocked_extension.png' });
    console.log('[RESULT E] Screenshot saved to: live_verified_blocked_extension.png');
    await popupPage.close();
  }

  await context.close();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch(_) {}

  console.log('\n======================================================');
  console.log('                 FINAL TEST VERDICT                   ');
  console.log('======================================================');
  console.log(`Fetch Request Blocked:   ${postFetch.blocked ? 'PASSED ✓ (Blocked by client)' : 'FAILED ✗'}`);
  console.log(`Script Tag Blocked:      ${scriptTag.blocked ? 'PASSED ✓ (Blocked by client)' : 'FAILED ✗'}`);
  console.log(`DNR Rules Applied:       ${dnrRules.length > 0 ? 'PASSED ✓ (' + dnrRules.length + ' rules)' : 'MANUAL'}`);
  console.log('======================================================\n');
}

testRealBlocking().catch(e => console.error('Test error:', e));
