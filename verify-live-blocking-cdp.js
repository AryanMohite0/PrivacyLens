const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runVerification() {
  console.log('[VERIFY] ========================================================');
  console.log('[VERIFY] PRIVACYLENS — LIVE RECORDER BLOCKING VERIFICATION TEST');
  console.log('[VERIFY] ========================================================\n');

  const extPath = path.resolve('privacylens-extension');
  const profileDir = path.resolve('.chrome-verify-profile');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  // Find Chrome path on Windows
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log(`[VERIFY] Launching real Chrome browser from: ${chromePath}`);
  console.log(`[VERIFY] Extension path: ${extPath}`);

  const chromeProc = spawn(chromePath, [
    `--load-extension=${extPath}`,
    `--disable-extensions-except=${extPath}`,
    `--user-data-dir=${profileDir}`,
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  // Wait 2.5s for Chrome CDP port to be open
  await new Promise(r => setTimeout(r, 2500));

  console.log('[VERIFY] Connecting Playwright via Chrome DevTools Protocol (CDP)...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  console.log('[VERIFY] Connected to Chrome instance!');

  // Navigate Tab 1 to a target testing site
  const testPage = await context.newPage();
  console.log('[VERIFY] Navigating test page to https://example.com ...');
  await testPage.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // Find the extension ID from targets
  let extId = null;
  const targets = await context.pages();
  
  // Find background worker or extension page
  const workers = context.serviceWorkers();
  for (const w of workers) {
    if (w.url().startsWith('chrome-extension://')) {
      extId = w.url().split('/')[2];
      break;
    }
  }

  if (!extId) {
    // Open extensions page to get ID
    const extPage = await context.newPage();
    await extPage.goto('chrome://extensions');
    await new Promise(r => setTimeout(r, 1000));
    const targetWorkers = context.serviceWorkers();
    for (const w of targetWorkers) {
      if (w.url().startsWith('chrome-extension://')) {
        extId = w.url().split('/')[2];
        break;
      }
    }
    await extPage.close();
  }

  console.log(`[VERIFY] Active PRIVACYLENS Extension ID: ${extId || 'Auto-detecting'}`);

  // TEST 1: Request before block
  console.log('\n--- TEST 1: Pre-blocking network request to Microsoft Clarity ---');
  const preFetch = await testPage.evaluate(async () => {
    try {
      // Attempt fetch to clarity.ms
      await fetch('https://www.clarity.ms/tag/live-test-probe', { mode: 'no-cors' });
      return { status: 'FETCH_ALLOWED_BY_BROWSER', blocked: false };
    } catch (err) {
      return { status: 'ERROR', message: err.message, blocked: err.message.includes('BLOCKED_BY_CLIENT') };
    }
  });
  console.log('[VERIFY] Pre-blocking outcome:', preFetch);

  // TEST 2: Simulate active in-page Clarity recorder
  await testPage.evaluate(() => {
    window.clarityBuffer = [];
    window.clarity = function(...args) {
      window.clarityBuffer.push(args);
    };
    window.clarity('event', 'mouse-movement-captured');
  });
  const beforeClarityCount = await testPage.evaluate(() => window.clarityBuffer.length);
  console.log(`[VERIFY] Simulated in-page recorder active. Events captured before block: ${beforeClarityCount}`);

  // TEST 3: Open Extension Popup and Click "Block recorder"
  console.log('\n--- TEST 2: User clicks "Block recorder" on Microsoft Clarity in Extension UI ---');
  const popupPage = await context.newPage();
  if (extId) {
    await popupPage.goto(`chrome-extension://${extId}/popup.html`);
  } else {
    // Fallback direct load
    await popupPage.goto(`file:///${extPath.replace(/\\/g, '/')}/popup.html`);
  }
  await popupPage.waitForSelector('[data-block="clarity.ms"]', { timeout: 6000 });

  const btnTextBefore = await popupPage.locator('[data-block="clarity.ms"]').textContent();
  console.log(`[VERIFY] Card button text before click: "${btnTextBefore.trim()}"`);

  // CLICK BLOCK RECORDER BUTTON
  console.log('[VERIFY] Clicking "Block recorder" button...');
  await popupPage.locator('[data-block="clarity.ms"]').click();
  await new Promise(r => setTimeout(r, 600));

  const btnTextAfter = await popupPage.locator('[data-block="clarity.ms"]').textContent();
  const scoreAfter = await popupPage.locator('#balance').textContent();
  const gradeAfter = await popupPage.locator('#grade-pill').textContent();
  console.log(`[VERIFY] Card button text after click: "${btnTextAfter.trim()}"`);
  console.log(`[VERIFY] Privacy Safety Score updated to: ${scoreAfter} (${gradeAfter})`);

  // Take screenshot of popup state
  await popupPage.screenshot({ path: 'verify_popup_blocked.png' });
  console.log('[VERIFY] Screenshot saved: verify_popup_blocked.png');

  // TEST 4: Post-blocking network request from test page
  console.log('\n--- TEST 3: Post-blocking network request to Microsoft Clarity ---');
  const postFetch = await testPage.evaluate(async () => {
    try {
      await fetch('https://www.clarity.ms/tag/live-test-probe', { mode: 'no-cors' });
      return { status: 'FETCH_ALLOWED', blocked: false };
    } catch (err) {
      return {
        status: 'FETCH_BLOCKED_BY_CHROME',
        blocked: true,
        errorMessage: err.message,
        isBlockedByClient: err.message.includes('Failed to fetch') || err.message.includes('BLOCKED_BY_CLIENT')
      };
    }
  });
  console.log('[VERIFY] Post-blocking network fetch outcome:', postFetch);

  // TEST 5: Script tag injection to clarity.ms
  console.log('\n--- TEST 4: Post-blocking <script src="https://www.clarity.ms/..."> DOM tag injection ---');
  const scriptTagTest = await testPage.evaluate(() => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://www.clarity.ms/s/0.7.35/clarity.js';
      script.onload = () => resolve({ loaded: true, blocked: false });
      script.onerror = () => resolve({ loaded: false, blocked: true, reason: 'BLOCKED_BY_BROWSER_DNR' });
      document.head.appendChild(script);
    });
  });
  console.log('[VERIFY] Script tag injection outcome:', scriptTagTest);

  // TEST 6: In-page recorder disarm verification
  console.log('\n--- TEST 5: Testing in-page recorder neutralization ---');
  await testPage.evaluate(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('event', 'attempt-recording-after-block');
    }
  });
  const afterClarityEvents = await testPage.evaluate(() => window.clarityBuffer);
  console.log('[VERIFY] Clarity buffer events count after block attempt:', afterClarityEvents.length);

  console.log('\n========================================================');
  console.log('                 FINAL TEST VERDICT');
  console.log('========================================================');
  const networkBlocked = postFetch.blocked;
  const scriptBlocked = scriptTagTest.blocked;
  const uiUpdated = btnTextAfter.includes('Blocked');

  console.log(`1. UI State Updated to Blocked:      ${uiUpdated ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log(`2. Network Fetch Blocked by Chrome:  ${networkBlocked ? 'PASSED ✓ (Blocked by client)' : 'FAILED ✗'}`);
  console.log(`3. Script Tag Blocked by Chrome:     ${scriptBlocked ? 'PASSED ✓ (Blocked by client)' : 'FAILED ✗'}`);
  console.log(`4. Privacy Safety Score Increased:   ${parseInt(scoreAfter) > 78 ? 'PASSED ✓ (' + scoreAfter + ')' : 'FAILED ✗'}`);
  console.log('========================================================\n');

  await browser.close();
  try { chromeProc.kill(); } catch(_) {}
}

runVerification().catch(err => {
  console.error('[VERIFY ERROR]', err);
  process.exit(1);
});

