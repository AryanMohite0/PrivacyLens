const { chromium } = require('playwright');
const path = require('path');

async function launchChrome() {
  const extensionPath = path.resolve(__dirname, 'privacylens-extension');
  const userDataDir = path.resolve(__dirname, '.google-chrome-privacylens-profile');

  console.log(`[PRIVACYLENS] Launching Google Chrome with extension: ${extensionPath}`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1366, height: 860 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  console.log('[PRIVACYLENS] Google Chrome window launched successfully!');

  // Tab 1: Extensions management page
  const page1 = context.pages()[0] || (await context.newPage());
  console.log('[PRIVACYLENS] Opening chrome://extensions ...');
  await page1.goto('chrome://extensions', { waitUntil: 'domcontentloaded' }).catch(() => {});

  // Tab 2: Test website (Nike)
  const page2 = await context.newPage();
  console.log('[PRIVACYLENS] Navigating to https://www.nike.com ...');
  await page2.goto('https://www.nike.com', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => {
    console.log('[PRIVACYLENS] Nike initial load captured.');
  });

  // Detect extension ID and open popup
  const workers = context.serviceWorkers();
  let extId = null;
  if (workers.length > 0) {
    extId = workers[0].url().split('/')[2];
    console.log(`[PRIVACYLENS] Extension ID in Chrome: ${extId}`);
  }

  if (extId) {
    const popupPage = await context.newPage();
    const popupUrl = `chrome-extension://${extId}/popup.html`;
    await popupPage.goto(popupUrl).catch(() => {});
    console.log(`[PRIVACYLENS] Opened Extension UI at ${popupUrl}`);
  }

  console.log('[PRIVACYLENS] Google Chrome is now actively running with PRIVACYLENS pre-installed!');

  // Keep process alive indefinitely
  await new Promise(() => {});
}

launchChrome().catch((err) => {
  console.error('[PRIVACYLENS] Error launching Google Chrome:', err);
});

