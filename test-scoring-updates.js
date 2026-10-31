const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

async function testScoringUpdates() {
  console.log('========================================================');
  console.log('  TEST: DYNAMIC PRIVACY SAFETY SCORING VERIFICATION');
  console.log('========================================================\n');

  const extPath = path.resolve('privacylens-extension');
  const tempProfile = path.resolve('.chrome-scoring-verify-profile');
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log(`[1] Launching real Chrome browser from: ${chromePath}`);

  const chromeProc = spawn(chromePath, [
    `--load-extension=${extPath}`,
    `--disable-extensions-except=${extPath}`,
    `--user-data-dir=${tempProfile}`,
    '--remote-debugging-port=9333',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  // Wait 2.5s for Chrome port
  await new Promise(r => setTimeout(r, 2500));

  console.log('[2] Connecting Playwright via CDP on port 9333...');
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const context = browser.contexts()[0];

  // Detect PrivacyLens extension ID by finding the background.js service worker
  let extId = null;
  console.log('[TEST] Service workers detected:', context.serviceWorkers().map(w => w.url()));

  const plWorker = context.serviceWorkers().find(w => w.url().includes('chrome-extension://') && w.url().endsWith('background.js'));
  if (plWorker) {
    extId = plWorker.url().split('/')[2];
  }

  if (!extId) {
    // Check all pages or open chrome://extensions to find the PrivacyLens card
    const extPage = await context.newPage();
    await extPage.goto('chrome://extensions');
    await new Promise(r => setTimeout(r, 1500));
    console.log('[TEST] After chrome://extensions, workers:', context.serviceWorkers().map(w => w.url()));
    const found = context.serviceWorkers().find(w => w.url().includes('chrome-extension://') && w.url().endsWith('background.js'));
    if (found) {
      extId = found.url().split('/')[2];
    }
    await extPage.close();
  }

  console.log(`[3] Extension ID detected: ${extId || 'Direct popup file mode'}`);

  // Open extension popup page
  const popupPage = await context.newPage();
  if (extId) {
    await popupPage.goto(`chrome-extension://${extId}/popup.html`);
  } else {
    await popupPage.goto(`file:///${extPath.replace(/\\/g, '/')}/popup.html`);
  }

  await popupPage.waitForSelector('#balance', { state: 'visible', timeout: 5000 });

  async function getPopupState() {
    return await popupPage.evaluate(() => {
      const balance = document.getElementById('balance').textContent.trim();
      const grade = document.getElementById('grade-pill').textContent.trim();
      const sub = document.getElementById('site-sub').textContent.trim();
      const count = document.getElementById('tracker-count-txt').textContent.trim();
      const hazard = document.getElementById('hazard-count').textContent.trim();
      const progress = document.getElementById('score-progress').style.width;
      return { balance: Number(balance), grade, sub, count, hazard: Number(hazard), progress };
    });
  }

  // 1. Initial State (All unblocked)
  console.log('\n--- State 0: Initial Unblocked State ---');
  let st = await getPopupState();
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 50 || st.grade !== 'GRADE D' || st.hazard !== 1) {
    throw new Error(`Initial state mismatch! Expected 50 / GRADE D / 1 hazard, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ Initial unblocked state verified: 50 / GRADE D / 1 hazard');

  // 2. Block Microsoft Clarity
  console.log('\n--- Action 1: Block Microsoft Clarity (-28 penalty removed) ---');
  const clarityBtn = popupPage.locator('[data-block="clarity.ms"]');
  await clarityBtn.click();
  await popupPage.waitForTimeout(600);

  st = await getPopupState();
  const clarityBtnText = await clarityBtn.textContent();
  console.log(`Button Text: "${clarityBtnText.trim()}"`);
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 78 || st.grade !== 'GRADE B' || st.hazard !== 0) {
    throw new Error(`State 1 mismatch! Expected 78 / GRADE B / 0 hazard, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ State 1 verified: Clarity blocked -> Score jumped from 50 to 78 (GRADE B), Hazards dropped to 0');

  // 3. Block Meta Pixel
  console.log('\n--- Action 2: Block Meta Pixel (-16 penalty removed) ---');
  const metaBtn = popupPage.locator('[data-block="connect.facebook.net"]');
  await metaBtn.click();
  await popupPage.waitForTimeout(600);

  st = await getPopupState();
  const metaBtnText = await metaBtn.textContent();
  console.log(`Button Text: "${metaBtnText.trim()}"`);
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 94 || st.grade !== 'GRADE A') {
    throw new Error(`State 2 mismatch! Expected 94 / GRADE A, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ State 2 verified: Meta blocked -> Score jumped from 78 to 94 (GRADE A)');

  // 4. Block Google Analytics
  console.log('\n--- Action 3: Block Google Analytics (-6 penalty removed) ---');
  const gaBtn = popupPage.locator('[data-block="google-analytics.com"]');
  await gaBtn.click();
  await popupPage.waitForTimeout(600);

  st = await getPopupState();
  const gaBtnText = await gaBtn.textContent();
  console.log(`Button Text: "${gaBtnText.trim()}"`);
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 100 || st.grade !== 'GRADE A+' || !st.count.includes('All Blocked')) {
    throw new Error(`State 3 mismatch! Expected 100 / GRADE A+ / All Blocked, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ State 3 verified: All blocked -> Score reached 100 (GRADE A+), "All tracking companies blocked"');

  // Take screenshot of 100% protected state
  await popupPage.screenshot({ path: 'verify_scoring_100.png' });
  console.log('[VERIFY] Screenshot saved: verify_scoring_100.png');

  // 5. Unblock Microsoft Clarity
  console.log('\n--- Action 4: Unblock Microsoft Clarity (+28 penalty restored) ---');
  await clarityBtn.click();
  await popupPage.waitForTimeout(600);

  st = await getPopupState();
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 72 || st.grade !== 'GRADE B' || st.hazard !== 1) {
    throw new Error(`State 4 mismatch! Expected 72 / GRADE B / 1 hazard, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ State 4 verified: Clarity unblocked -> Score dropped dynamically to 72 (GRADE B), Hazard restored to 1');

  // 6. Unblock Meta Pixel
  console.log('\n--- Action 5: Unblock Meta Pixel (+16 penalty restored) ---');
  await metaBtn.click();
  await popupPage.waitForTimeout(600);

  st = await getPopupState();
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 56 || st.grade !== 'GRADE C') {
    throw new Error(`State 5 mismatch! Expected 56 / GRADE C, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ State 5 verified: Meta unblocked -> Score dropped dynamically to 56 (GRADE C)');

  // 7. Unblock Google Analytics
  console.log('\n--- Action 6: Unblock Google Analytics (+6 penalty restored) ---');
  await gaBtn.click();
  await popupPage.waitForTimeout(600);

  st = await getPopupState();
  console.log(`Score: ${st.balance} | Grade: ${st.grade} | Hazards: ${st.hazard} | Companies: "${st.count}" | Width: ${st.progress}`);
  if (st.balance !== 50 || st.grade !== 'GRADE D' || st.hazard !== 1) {
    throw new Error(`State 6 mismatch! Expected 50 / GRADE D / 1 hazard, got: ${JSON.stringify(st)}`);
  }
  console.log('✓ State 6 verified: All unblocked -> Score returned exactly to baseline 50 (GRADE D)');

  await browser.close();
  try {
    chromeProc.kill('SIGKILL');
  } catch (_) {}

  console.log('\n========================================================');
  console.log('  ALL SCORING & BLOCKING TRANSITIONS PASSED PERFECTLY!');
  console.log('========================================================\n');
}

testScoringUpdates().catch((err) => {
  console.error('[TEST FAILURE]', err);
  process.exit(1);
});
