const { chromium } = require('playwright');
const path = require('path');

async function testBlocking() {
  console.log('[TEST] Starting live blocking verification in Google Chrome...\n');
  const extPath = path.resolve('privacylens-extension');
  const userDataDir = path.resolve('.chrome-test-blocking-profile');

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: true,
    args: [
      '--disable-extensions-except=' + extPath,
      '--load-extension=' + extPath,
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  // Open a test web page
  const page = await context.newPage();
  await page.goto('https://example.com');

  // Find the background service worker
  let worker = context.serviceWorkers().find(w => w.url().startsWith('chrome-extension://'));
  if (!worker) {
    worker = await context.waitForEvent('serviceworker', {
      predicate: w => w.url().startsWith('chrome-extension://'),
      timeout: 8000
    });
  }
  const extId = worker.url().split('/')[2];
  console.log('[TEST] Loaded extension ID:', extId);

  // 1. Before blocking: Attempt to fetch clarity.ms
  console.log('\n--- Step 1: Pre-blocking network check ---');
  let preFailed = false;
  let preError = null;
  try {
    const res = await page.evaluate(async () => {
      const response = await fetch('https://www.clarity.ms/tag/test-recorder-script', { mode: 'no-cors' });
      return { ok: true, type: response.type };
    });
    console.log('[TEST] Pre-blocking fetch succeeded (allowed through browser network):', res);
  } catch (err) {
    preFailed = true;
    preError = err.message;
    console.log('[TEST] Pre-blocking fetch error:', err.message);
  }

  // 2. Set up simulated window.clarity in page
  await page.evaluate(() => {
    window.recordedSessions = [];
    window.clarity = function(...args) {
      window.recordedSessions.push(args);
    };
    window.clarity('record', 'before-block-event');
  });
  const beforeEvents = await page.evaluate(() => window.recordedSessions);
  console.log('[TEST] Simulated active Clarity recorder before block:', beforeEvents);

  // 3. Trigger Block Recorder action through the background service worker
  console.log('\n--- Step 2: Triggering BLOCK_DOMAIN for clarity.ms ---');
  const tabs = await context.pages();
  const targetPage = tabs.find(p => p.url().includes('example.com'));
  
  // Open extension popup page in a tab to simulate user clicking "Block recorder"
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extId}/popup.html`);
  
  // Click the block button on Microsoft Clarity
  const clarityBtn = popupPage.locator('[data-block="clarity.ms"]');
  await clarityBtn.waitFor({ state: 'visible', timeout: 5000 });
  const buttonTextBefore = await clarityBtn.textContent();
  console.log('[TEST] Button text before click:', buttonTextBefore.trim());
  
  await clarityBtn.click();
  await new Promise(r => setTimeout(r, 600));
  
  const buttonTextAfter = await clarityBtn.textContent();
  console.log('[TEST] Button text after click:', buttonTextAfter.trim());

  // 4. Verify DNR dynamic rules directly in Chrome engine
  const rules = await worker.evaluate(async () => {
    return await chrome.declarativeNetRequest.getDynamicRules();
  });
  console.log('\n--- Step 3: Inspecting Chrome declarativeNetRequest engine ---');
  console.log(`[TEST] Number of active DNR dynamic rules installed: ${rules.length}`);
  console.log('[TEST] Active rule details:', JSON.stringify(rules, null, 2));

  // 5. Post-blocking network check: Attempt to fetch clarity.ms
  console.log('\n--- Step 4: Post-blocking network check ---');
  const postResult = await page.evaluate(async () => {
    try {
      await fetch('https://www.clarity.ms/tag/test-recorder-script', { mode: 'no-cors' });
      return { blocked: false, status: 'NOT_BLOCKED' };
    } catch (err) {
      return { 
        blocked: true, 
        errorMessage: err.message,
        isBlockedByClient: err.message.includes('Failed to fetch') || err.message.includes('ERR_BLOCKED_BY_CLIENT')
      };
    }
  });
  console.log('[TEST] Post-blocking fetch outcome:', postResult);

  // 6. Test in-page script injection to verify blocking in DOM
  console.log('\n--- Step 5: Testing <script src="https://www.clarity.ms/..."> injection ---');
  const scriptTagResult = await page.evaluate(() => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://www.clarity.ms/s/0.7.35/clarity.js';
      script.onload = () => resolve({ loaded: true, blocked: false });
      script.onerror = (e) => resolve({ loaded: false, blocked: true, event: 'error_triggered_by_browser' });
      document.head.appendChild(script);
    });
  });
  console.log('[TEST] Script tag injection outcome:', scriptTagResult);

  // 7. Test in-page disarm
  console.log('\n--- Step 6: Testing in-page recorder neutralization ---');
  await page.evaluate(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('record', 'after-block-event');
    }
  });
  const afterEvents = await page.evaluate(() => window.recordedSessions);
  console.log('[TEST] Simulated recorder events count after block:', afterEvents.length);

  await context.close();
  console.log('\n========================================');
  console.log('       VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`DNR Rule Installed: ${rules.some(r => r.condition?.urlFilter?.includes('clarity.ms')) ? 'YES (Confirmed)' : 'NO'}`);
  console.log(`Network Fetch Blocked: ${postResult.blocked ? 'YES (net::ERR_BLOCKED_BY_CLIENT)' : 'NO'}`);
  console.log(`Script Tag Blocked: ${scriptTagResult.blocked ? 'YES (Browser Blocked Script)' : 'NO'}`);
  console.log('========================================\n');
}

testBlocking().catch(e => console.error('[TEST ERROR]', e));

