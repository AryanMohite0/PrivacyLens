const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generateAssets() {
  console.log('[STORE ASSETS] Launching Chromium to generate 1280x800 and 440x280 assets...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const extDir = path.resolve('privacylens-extension');
  const popupCss = fs.readFileSync(path.join(extDir, 'popup.css'), 'utf8');
  const fontBase64 = fs.readFileSync(path.join(extDir, 'font.ttf')).toString('base64');
  const iconBase64 = fs.readFileSync(path.join(extDir, 'icons/icon128.png')).toString('base64');

  const assetsDir = path.resolve('docs/assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  // -------------------------------------------------------------
  // 1. Screenshot 1 (1280x800): Real-time Privacy Score & Tracker Detection
  // -------------------------------------------------------------
  const page1 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page1.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'LocalFont';
          src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1280px;
          height: 800px;
          background: radial-gradient(circle at 70% 30%, #202621 0%, #0d0f0e 100%);
          font-family: 'LocalFont', -apple-system, sans-serif;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 60px 80px;
          overflow: hidden;
        }
        .left-col {
          max-width: 500px;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          background: rgba(209, 251, 88, 0.1);
          border: 1px solid #d1fb58;
          color: #d1fb58;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 24px;
        }
        .brand-badge img { width: 18px; height: 18px; }
        h1 {
          font-size: 46px;
          line-height: 1.15;
          font-weight: 800;
          margin-bottom: 20px;
          color: #ffffff;
        }
        h1 span {
          color: #d1fb58;
        }
        p {
          font-size: 18px;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 30px;
        }
        .feature-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          color: #cbd5e1;
        }
        .feature-item span.icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(209, 251, 88, 0.15);
          color: #d1fb58;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 13px;
        }
        .mockup-container {
          width: 440px;
          background: #151716;
          border-radius: 16px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.12);
          overflow: hidden;
          position: relative;
        }
      </style>
      <style>${popupCss}</style>
    </head>
    <body>
      <div class="left-col">
        <div class="brand-badge">
          <img src="data:image/png;base64,${iconBase64}" />
          PRIVACYLENS 1.0
        </div>
        <h1>See What Websites <span>Don't Tell You</span></h1>
        <p>Continuous client-side surveillance inspection with grounded evidence. Detect undisclosed ad trackers, device fingerprinting, and invasive session recorders.</p>
        <ul class="feature-list">
          <li class="feature-item"><span class="icon">✓</span> <span>Dynamic Privacy Safety Score (0–100)</span></li>
          <li class="feature-item"><span class="icon">✓</span> <span>Micro-surveillance & mouse trail inspection</span></li>
          <li class="feature-item"><span class="icon">✓</span> <span>Zero data collection & zero telemetry leaks</span></li>
        </ul>
      </div>

      <div class="mockup-container">
        <header class="topbar" style="padding: 16px 20px;">
          <div class="topbar-brand">
            <span class="icon"><img src="data:image/png;base64,${iconBase64}" style="width: 20px; height: 20px;" /></span>
            <span class="wordmark">PRIVACYLENS</span>
          </div>
          <button class="guard-pill active" style="font-size: 11px; padding: 4px 10px;">Guarded <span>✓</span></button>
        </header>

        <section class="balance" style="margin: 0 20px 16px 20px;">
          <div class="balance-top">
            <span>PRIVACY SAFETY SCORE</span>
            <span class="pill">GRADE A+</span>
          </div>
          <div class="balance-value">
            <span>100</span>
            <span class="point-symbol">P</span>
            <svg viewBox="0 0 100 40" class="spark">
              <path d="m2 35 12-8 10 4 15-16 12 5 14-10 12 4 20-12"/>
            </svg>
          </div>
          <div class="balance-bottom">
            <span><i>🛡️</i> <strong>0 companies</strong> tracking you</span>
            <span>Safety: <strong>Maximum Privacy</strong></span>
          </div>
          <div class="progress"><span style="width: 100%;"></span></div>
        </section>

        <div style="padding: 0 20px 20px 20px;">
          <article class="reward-card card-blocked" style="margin-bottom: 12px;">
            <div class="reward-content" style="padding: 14px;">
              <div class="reward-overline">Microsoft Clarity · Screen Replay</div>
              <h3 style="font-size: 13px; font-weight: 700; margin: 4px 0 6px 0;"><em>Blocked</em> Microsoft Clarity recorder</h3>
              <p style="font-size: 11px; line-height: 1.4; color: #94a3b8; margin-bottom: 10px;">Microsoft Clarity recording neutralized. Mouse trails, clicks, and page scrolls stopped from leaving device.</p>
              <div class="reward-bottom">
                <span class="reward-points" style="color: #d1fb58; font-weight: 800; font-size: 12px;">Protected ✓</span>
                <button class="activate activated" style="padding: 4px 10px; font-size: 11px;">Blocked ✓</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </body>
    </html>
  `);
  await page1.screenshot({ path: path.join(assetsDir, 'chrome_store_screenshot_1.png') });
  console.log('[STORE ASSETS] ✓ Created chrome_store_screenshot_1.png (1280x800)');

  // -------------------------------------------------------------
  // 2. Screenshot 2 (1280x800): 1-Click Tracker Neutralization
  // -------------------------------------------------------------
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page2.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'LocalFont';
          src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1280px;
          height: 800px;
          background: radial-gradient(circle at 30% 70%, #1e261f 0%, #0d0f0e 100%);
          font-family: 'LocalFont', -apple-system, sans-serif;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 60px 80px;
          overflow: hidden;
        }
        .left-col {
          max-width: 500px;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          background: rgba(255, 142, 119, 0.1);
          border: 1px solid #ff8e77;
          color: #ff8e77;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 46px;
          line-height: 1.15;
          font-weight: 800;
          margin-bottom: 20px;
          color: #ffffff;
        }
        h1 span {
          color: #ff8e77;
        }
        p {
          font-size: 18px;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 30px;
        }
        .mockup-container {
          width: 440px;
          background: #151716;
          border-radius: 16px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.12);
          overflow: hidden;
        }
      </style>
      <style>${popupCss}</style>
    </head>
    <body>
      <div class="left-col">
        <div class="brand-badge">
          INSTANT ACTIVE DEFENSE
        </div>
        <h1>1-Click <span>Tracker & Recorder</span> Neutralization</h1>
        <p>Halt invasive video-like screen recording, keystroke captures, and cross-site ad retargeting instantly via Chrome DeclarativeNetRequest rules.</p>
        <div style="display: flex; gap: 16px;">
          <div style="background: rgba(255,255,255,0.05); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 28px; font-weight: 800; color: #d1fb58;">0ms</div>
            <div style="font-size: 13px; color: #94a3b8;">Latency Impact</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 28px; font-weight: 800; color: #ff8e77;">100%</div>
            <div style="font-size: 13px; color: #94a3b8;">Local Execution</div>
          </div>
        </div>
      </div>

      <div class="mockup-container" style="padding: 24px;">
        <article class="reward-card" style="margin-bottom: 16px; border: 1px solid rgba(255, 142, 119, 0.3);">
          <div class="reward-content" style="padding: 16px;">
            <div class="reward-overline">Meta Platforms · Ad Retargeting</div>
            <h3 style="font-size: 14px; font-weight: 700; margin: 4px 0 6px 0;"><em>Follows</em> items you view for Instagram ads</h3>
            <p style="font-size: 12px; line-height: 1.4; color: #94a3b8; margin-bottom: 12px;">When you view products or apparel here, Meta tracks your shopping habits to display retargeted ads later.</p>
            <div class="reward-bottom">
              <span class="reward-points" style="color: #ff8e77; font-weight: 800; font-size: 13px;">-16 Safety</span>
              <button class="activate" style="padding: 6px 14px; font-size: 12px;">Block tracker ↗</button>
            </div>
          </div>
        </article>

        <article class="reward-card card-blocked">
          <div class="reward-content" style="padding: 16px;">
            <div class="reward-overline">Alphabet Inc · Google Analytics</div>
            <h3 style="font-size: 14px; font-weight: 700; margin: 4px 0 6px 0;"><em>Blocked</em> Google Analytics</h3>
            <p style="font-size: 12px; line-height: 1.4; color: #94a3b8; margin-bottom: 12px;">Google Analytics script has been blocked from logging your visits or measuring session metrics.</p>
            <div class="reward-bottom">
              <span class="reward-points" style="color: #d1fb58; font-weight: 800; font-size: 13px;">Protected ✓</span>
              <button class="activate activated" style="padding: 6px 14px; font-size: 12px;">Blocked ✓</button>
            </div>
          </div>
        </article>
      </div>
    </body>
    </html>
  `);
  await page2.screenshot({ path: path.join(assetsDir, 'chrome_store_screenshot_2.png') });
  console.log('[STORE ASSETS] ✓ Created chrome_store_screenshot_2.png (1280x800)');

  // -------------------------------------------------------------
  // 3. Screenshot 3 (1280x800): Plain-English Evidence Copilot
  // -------------------------------------------------------------
  const page3 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page3.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'LocalFont';
          src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1280px;
          height: 800px;
          background: radial-gradient(circle at 60% 40%, #172421 0%, #0a0e0c 100%);
          font-family: 'LocalFont', -apple-system, sans-serif;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 60px 80px;
          overflow: hidden;
        }
        .left-col {
          max-width: 500px;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          background: rgba(209, 251, 88, 0.1);
          border: 1px solid #d1fb58;
          color: #d1fb58;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 46px;
          line-height: 1.15;
          font-weight: 800;
          margin-bottom: 20px;
          color: #ffffff;
        }
        h1 span {
          color: #d1fb58;
        }
        p {
          font-size: 18px;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 30px;
        }
        .mockup-container {
          width: 440px;
          background: #151716;
          border-radius: 16px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.12);
          overflow: hidden;
          padding: 24px;
        }
        .msg-bubble {
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .msg-user {
          background: #2a312b;
          color: #ffffff;
          align-self: flex-end;
          border-bottom-right-radius: 2px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .msg-bot {
          background: #1b1e1c;
          border: 1px solid #29302b;
          color: #e2e8f0;
          border-bottom-left-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="left-col">
        <div class="brand-badge">
          PLAIN-ENGLISH PRIVACY COPILOT
        </div>
        <h1>Ask Questions, <span>Get Real Evidence</span></h1>
        <p>No legal jargon. Ask PrivacyLens about who is tracking you, what gets recorded, and whether the site's privacy policy tells the truth.</p>
        <div style="font-size: 15px; color: #d1fb58; font-weight: 600;">
          💡 Try asking: "Is this site watching my mouse?"
        </div>
      </div>

      <div class="mockup-container">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #232824;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #d1fb58; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #151716;">AI</div>
          <div>
            <div style="font-weight: 700; font-size: 14px;">Privacy Copilot</div>
            <div style="font-size: 11px; color: #d1fb58;">Grounded in Live Telemetry</div>
          </div>
        </div>

        <div class="msg-bubble msg-user">
          Is this site watching my mouse movements?
        </div>

        <div class="msg-bubble msg-bot">
          <strong>Yes!</strong> This website loads <strong>Microsoft Clarity</strong>, an active screen recording service that logs video-like playbacks of your mouse trail, button clicks, and scroll positions.<br><br>
          <em>Click <strong>"Block recorder"</strong> to neutralize it immediately.</em>
        </div>

        <div class="msg-bubble msg-user">
          Does their privacy policy disclose this?
        </div>

        <div class="msg-bubble msg-bot">
          <strong>Discrepancy detected:</strong> We audited the privacy policy and discovered no explicit mention of third-party session recording partners.
        </div>
      </div>
    </body>
    </html>
  `);
  await page3.screenshot({ path: path.join(assetsDir, 'chrome_store_screenshot_3.png') });
  console.log('[STORE ASSETS] ✓ Created chrome_store_screenshot_3.png (1280x800)');

  // -------------------------------------------------------------
  // 4. Promo Tile (440x280): Small Promo Tile for Chrome Web Store
  // -------------------------------------------------------------
  const pagePromo = await browser.newPage({ viewport: { width: 440, height: 280 } });
  await pagePromo.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'LocalFont';
          src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 440px;
          height: 280px;
          background: radial-gradient(circle at 50% 40%, #1f2821 0%, #0e1210 100%);
          font-family: 'LocalFont', -apple-system, sans-serif;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .icon-box {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: #151716;
          border: 1.5px solid #d1fb58;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(209, 251, 88, 0.2);
          margin-bottom: 14px;
        }
        .icon-box img { width: 42px; height: 42px; }
        h1 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #ffffff;
          margin-bottom: 6px;
        }
        h1 span { color: #d1fb58; }
        p {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.4;
          max-width: 320px;
        }
      </style>
    </head>
    <body>
      <div class="icon-box">
        <img src="data:image/png;base64,${iconBase64}" />
      </div>
      <h1>PRIVACY<span>LENS</span></h1>
      <p>AI-Powered Privacy Inspector & Real-Time Tracker Neutralizer</p>
    </body>
    </html>
  `);
  await pagePromo.screenshot({ path: path.join(assetsDir, 'chrome_store_promo_small.png') });
  console.log('[STORE ASSETS] ✓ Created chrome_store_promo_small.png (440x280)');

  await browser.close();
  console.log('[STORE ASSETS] All store assets successfully generated!');
}

generateAssets().catch(err => {
  console.error('[ASSET ERROR]', err);
  process.exit(1);
});
