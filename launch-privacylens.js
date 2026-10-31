const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function launch() {
  const extensionPath = path.resolve(__dirname, 'privacylens-extension');
  const userDataDir = path.resolve(__dirname, '.edge-privacylens-profile');

  console.log(`[PRIVACYLENS] Starting browser with extension: ${extensionPath}`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  console.log('[PRIVACYLENS] Browser launched with extension loaded!');

  // Open active testing website
  const page = context.pages()[0] || (await context.newPage());
  console.log('[PRIVACYLENS] Opening https://www.nike.com ...');
  await page.goto('https://www.nike.com', { waitUntil: 'domcontentloaded' }).catch(() => {});

  // Get extension ID if possible
  const workers = context.serviceWorkers();
  let extId = null;
  if (workers.length > 0) {
    extId = workers[0].url().split('/')[2];
    console.log(`[PRIVACYLENS] Active Extension ID: ${extId}`);
  }

  if (extId) {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extId}/popup.html`);
    console.log(`[PRIVACYLENS] Extension UI open at chrome-extension://${extId}/popup.html`);
  }

  console.log('[PRIVACYLENS] Real-time surveillance inspection is running live on your screen!');

  // Keep alive
  await new Promise(() => {});
}

launch().catch((err) => {
  console.error('[PRIVACYLENS] Launch error:', err);
});
