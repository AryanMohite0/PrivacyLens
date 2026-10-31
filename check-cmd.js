const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
  const dummyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dummy-ext-'));
  fs.writeFileSync(path.join(dummyDir, 'manifest.json'), JSON.stringify({
    manifest_version: 3,
    name: 'Dummy',
    version: '1.0',
    background: { service_worker: 'bg.js' }
  }));
  fs.writeFileSync(path.join(dummyDir, 'bg.js'), 'console.log("Dummy worker alive");');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));

  const context = await chromium.launchPersistentContext(tempDir, {
    channel: 'chrome',
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      '--disable-extensions-except=' + dummyDir,
      '--load-extension=' + dummyDir
    ]
  });

  const page = await context.newPage();
  await page.goto('chrome://version');
  const cmdLine = await page.evaluate(() => document.querySelector('#command_line')?.textContent);
  console.log('Chrome actual command line:\n', cmdLine);

  await context.close();
  try { 
    fs.rmSync(dummyDir, { recursive: true, force: true });
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch(_) {}
})();

