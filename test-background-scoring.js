const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

// Load background.js into a sandboxed environment
const bgCode = fs.readFileSync(path.resolve('privacylens-extension/background.js'), 'utf8');

// Minimal chrome mock
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  Set,
  Map,
  Array,
  URL,
  chrome: {
    runtime: {
      onInstalled: { addListener: () => {} },
      onMessage: { addListener: () => {} },
      sendMessage: () => Promise.resolve(),
    },
    webRequest: {
      onBeforeRequest: { addListener: () => {} },
    },
    tabs: {
      onUpdated: { addListener: () => {} },
      onRemoved: { addListener: () => {} },
      query: () => {},
      sendMessage: () => Promise.resolve(),
    },
    action: {
      setBadgeText: () => {},
      setBadgeBackgroundColor: () => {},
    },
    declarativeNetRequest: {
      updateDynamicRules: () => Promise.resolve(),
      getDynamicRules: () => Promise.resolve([]),
    },
    storage: {
      local: {
        get: (_, cb) => cb && cb({}),
        set: (_, cb) => cb && cb(),
      },
    },
  },
};

vm.createContext(sandbox);
vm.runInContext(bgCode, sandbox);

console.log('========================================================');
console.log('  TESTING BACKGROUND.JS CALCULATE_SCORE LOGIC');
console.log('========================================================\n');

// 1. Test fallback baseline with empty events
console.log('--- Test 1: Fallback baseline when events array is empty ---');
const emptyAssessment = sandbox.calculateScore([], [], [], [], false, new Set());
console.log('Empty events assessment:', emptyAssessment.score);
assert.strictEqual(emptyAssessment.score.overallPrivacyScore, 50, 'Baseline score should be 50');
assert.strictEqual(emptyAssessment.score.grade, 'D', 'Baseline grade should be D');
assert.strictEqual(emptyAssessment.uniqueTrackersCount, 3, 'Baseline unique trackers should be 3');
console.log('✓ Test 1 passed: Baseline score is 50 / Grade D / 3 trackers\n');

// 2. Test fallback baseline with Clarity blocked
console.log('--- Test 2: Fallback baseline with Clarity blocked ---');
const clarityBlockedAssessment = sandbox.calculateScore([], [], [], [], false, new Set(['clarity.ms']));
console.log('Clarity blocked assessment:', clarityBlockedAssessment.score);
assert.strictEqual(clarityBlockedAssessment.score.overallPrivacyScore, 78, 'Clarity blocked score should be 78');
assert.strictEqual(clarityBlockedAssessment.score.grade, 'B', 'Clarity blocked grade should be B');
assert.strictEqual(clarityBlockedAssessment.uniqueTrackersCount, 2, 'Trackers count should drop to 2');
console.log('✓ Test 2 passed: Clarity blocked score is 78 / Grade B / 2 trackers\n');

// 3. Test fallback baseline with Clarity and Meta blocked
console.log('--- Test 3: Fallback baseline with Clarity and Meta blocked ---');
const metaBlockedAssessment = sandbox.calculateScore([], [], [], [], false, new Set(['clarity.ms', 'connect.facebook.net']));
console.log('Meta blocked assessment:', metaBlockedAssessment.score);
assert.strictEqual(metaBlockedAssessment.score.overallPrivacyScore, 94, 'Meta blocked score should be 94');
assert.strictEqual(metaBlockedAssessment.score.grade, 'A', 'Meta blocked grade should be A');
assert.strictEqual(metaBlockedAssessment.uniqueTrackersCount, 1, 'Trackers count should drop to 1');
console.log('✓ Test 3 passed: Clarity + Meta blocked score is 94 / Grade A / 1 tracker\n');

// 4. Test fallback baseline with all three blocked
console.log('--- Test 4: Fallback baseline with all three blocked ---');
const allBlockedAssessment = sandbox.calculateScore([], [], [], [], false, new Set(['clarity.ms', 'connect.facebook.net', 'google-analytics.com']));
console.log('All blocked assessment:', allBlockedAssessment.score);
assert.strictEqual(allBlockedAssessment.score.overallPrivacyScore, 100, 'All blocked score should be 100');
assert.strictEqual(allBlockedAssessment.score.grade, 'A+', 'All blocked grade should be A+');
assert.strictEqual(allBlockedAssessment.uniqueTrackersCount, 0, 'Trackers count should drop to 0');
console.log('✓ Test 4 passed: All blocked score is 100 / Grade A+ / 0 trackers\n');

// 5. Test with real simulated network events
console.log('--- Test 5: Live telemetry events scoring ---');
const liveEvents = [
  {
    destinationDomain: 'c.clarity.ms',
    trackerMatch: true,
    trackerCategory: 'screen_recording',
    trackerOwner: 'Microsoft Clarity',
    isThirdParty: true,
  },
  {
    destinationDomain: 'connect.facebook.net',
    trackerMatch: true,
    trackerCategory: 'ad_retargeting',
    trackerOwner: 'Meta Pixel',
    isThirdParty: true,
  },
  {
    destinationDomain: 'google-analytics.com',
    trackerMatch: true,
    trackerCategory: 'analytics',
    trackerOwner: 'Google Analytics',
    isThirdParty: true,
  },
];

// 5a. Policy discloses ad partners
const policyWithAds = [{ category: 'advertising_targeting', claimText: 'We disclose advertising partners.' }];
const unblockedLive = sandbox.calculateScore(liveEvents, [], [], policyWithAds, true, new Set());
console.log('Live unblocked assessment (policy discloses ads):', unblockedLive.score);
assert.strictEqual(unblockedLive.score.overallPrivacyScore, 50, 'Live unblocked score should be 50');
assert.strictEqual(unblockedLive.uniqueTrackersCount, 3, 'Live unblocked unique trackers should be 3');

// Block Clarity in live events
const liveClarityBlocked = sandbox.calculateScore(liveEvents, [], [], policyWithAds, true, new Set(['clarity.ms']));
console.log('Live Clarity blocked assessment:', liveClarityBlocked.score);
assert.strictEqual(liveClarityBlocked.score.overallPrivacyScore, 78, 'Live Clarity blocked score should be 78');
assert.strictEqual(liveClarityBlocked.uniqueTrackersCount, 2, 'Live unblocked unique trackers should be 2');

// Block Meta in live events
const liveMetaBlocked = sandbox.calculateScore(liveEvents, [], [], policyWithAds, true, new Set(['clarity.ms', 'connect.facebook.net']));
console.log('Live Meta blocked assessment:', liveMetaBlocked.score);
assert.strictEqual(liveMetaBlocked.score.overallPrivacyScore, 94, 'Live Meta blocked score should be 94');
assert.strictEqual(liveMetaBlocked.uniqueTrackersCount, 1, 'Live unblocked unique trackers should be 1');

// Block GA in live events
const liveAllBlocked = sandbox.calculateScore(liveEvents, [], [], policyWithAds, true, new Set(['clarity.ms', 'connect.facebook.net', 'google-analytics.com']));
console.log('Live All blocked assessment:', liveAllBlocked.score);
assert.strictEqual(liveAllBlocked.score.overallPrivacyScore, 100, 'Live All blocked score should be 100');
assert.strictEqual(liveAllBlocked.uniqueTrackersCount, 0, 'Live unblocked unique trackers should be 0');

// 5b. Policy omits ads (Hidden tracking Reality Gap detected!)
const unblockedRealityGap = sandbox.calculateScore(liveEvents, [], [], [], true, new Set());
console.log('Live unblocked with Reality Gap:', unblockedRealityGap.score);
assert.strictEqual(unblockedRealityGap.score.overallPrivacyScore, 35, 'Undisclosed ads should add 15 penalty');
assert.strictEqual(unblockedRealityGap.score.disclosureConcerns, 15, 'Disclosure concern should be 15');

// When Meta Pixel is blocked, the Reality Gap penalty is neutralized!
const metaBlockedNeutralizedGap = sandbox.calculateScore(liveEvents, [], [], [], true, new Set(['connect.facebook.net']));
console.log('Meta blocked neutralizes reality gap:', metaBlockedNeutralizedGap.score);
assert.strictEqual(metaBlockedNeutralizedGap.score.disclosureConcerns, 0, 'Disclosure concern neutralized on block');
assert.strictEqual(metaBlockedNeutralizedGap.score.overallPrivacyScore, 66, 'Score without Meta and without gap penalty (100 - 28 clarity - 6 ga = 66)');

console.log('✓ Test 5 passed: Live events scoring correctly eliminates penalties on block!\n');

console.log('========================================================');
console.log('  ALL BACKGROUND SCORING TESTS PASSED (5/5)!');
console.log('========================================================');
