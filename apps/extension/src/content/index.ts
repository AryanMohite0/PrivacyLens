/**
 * PRIVACYLENS — Content Script
 * Safe, isolated client-side storage, permission, and policy link inspector.
 */

import {
  PermissionObservation,
  StorageObservation,
} from '../../../../packages/shared/src';

function inspectStorage(): StorageObservation[] {
  const observations: StorageObservation[] = [];

  // 1. LocalStorage keys inspection
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      let byteSizeEstimate = 0;
      let hasHighEntropyIdentifier = false;

      try {
        const val = window.localStorage.getItem(key) || '';
        byteSizeEstimate = key.length + val.length;

        // Check for UUID, high-entropy hex, or tracking token signatures
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) ||
          (/^[a-f0-9]{32,64}$/i.test(val) && val.length >= 32) ||
          key.includes('fbp') ||
          key.includes('ga_') ||
          key.includes('uid') ||
          key.includes('device_id')
        ) {
          hasHighEntropyIdentifier = true;
        }
      } catch {
        // Protected / security access restricted
      }

      observations.push({
        type: 'localStorage',
        key,
        byteSizeEstimate,
        hasHighEntropyIdentifier,
      });
    }
  } catch (err) {
    // LocalStorage might be blocked by site CSP/incognito
  }

  return observations;
}

async function inspectPermissions(): Promise<PermissionObservation[]> {
  const observations: PermissionObservation[] = [];

  if (!navigator.permissions || !navigator.permissions.query) {
    return observations;
  }

  const permissionsToCheck: Array<{ name: PermissionName; risk: PermissionObservation['riskLevel'] }> = [
    { name: 'geolocation' as PermissionName, risk: 'high' },
    { name: 'notifications' as PermissionName, risk: 'medium' },
  ];

  for (const item of permissionsToCheck) {
    try {
      const status = await navigator.permissions.query({ name: item.name });
      observations.push({
        name: item.name,
        state: status.state,
        riskLevel: item.risk,
      });
    } catch {
      // Permission not supported in this context
    }
  }

  return observations;
}

function discoverPolicyUrl(): string | null {
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
      } catch {
        return href;
      }
    }
  }
  return null;
}

async function runClientInspection() {
  const storage = inspectStorage();
  const permissions = await inspectPermissions();
  const policyUrl = discoverPolicyUrl();

  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_OBSERVATION',
    storage,
    permissions,
    policyUrl,
  });
}

// Run after document reaches idle
if (document.readyState === 'complete') {
  runClientInspection();
} else {
  window.addEventListener('load', runClientInspection);
}
