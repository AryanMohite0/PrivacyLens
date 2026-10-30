/**
 * PRIVACYLENS — eTLD+1 Domain Classifier
 * Deterministically determines effective root domains and first-party vs third-party status.
 */

// Common two-level and public suffixes
const MULTI_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'me.uk',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'co.in',
  'net.in',
  'org.in',
  'gen.in',
  'firm.in',
  'ind.in',
  'co.jp',
  'ne.jp',
  'or.jp',
  'go.jp',
  'ac.jp',
  'com.br',
  'net.br',
  'org.br',
  'co.nz',
  'net.nz',
  'org.nz',
  'com.mx',
  'org.mx',
  'com.sg',
  'edu.sg',
  'gov.sg',
  'com.tr',
  'co.za',
  'com.cn',
  'net.cn',
  'org.cn',
  'com.tw',
  'org.tw',
  'com.hk',
  'edu.hk',
  'gov.hk',
  'com.de',
  'com.fr',
]);

/**
 * Extracts the eTLD+1 (root domain) from a given hostname or full URL.
 * e.g. "subdomain.store.nike.co.uk" -> "nike.co.uk"
 *      "adservice.google.com" -> "google.com"
 *      "localhost" -> "localhost"
 */
export function getRootDomain(hostnameOrUrl: string): string {
  let hostname = hostnameOrUrl.trim().toLowerCase();
  try {
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }
  } catch {
    // Keep as hostname if URL parsing fails
  }

  // Remove port numbers if present
  hostname = hostname.split(':')[0];

  // IP addresses or localhost
  if (
    hostname === 'localhost' ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
    hostname.includes(':')
  ) {
    return hostname;
  }

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return hostname;
  }

  // Check if last two parts form a known multi-part TLD (e.g. "co.uk")
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_TLDS.has(lastTwo)) {
    if (parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return hostname;
  }

  // Standard single TLD (e.g. "example.com")
  return parts.slice(-2).join('.');
}

/**
 * Checks if target domain is third-party relative to the site domain.
 */
export function isThirdPartyDomain(siteDomain: string, targetDomain: string): boolean {
  const siteRoot = getRootDomain(siteDomain);
  const targetRoot = getRootDomain(targetDomain);

  if (!siteRoot || !targetRoot) return false;
  return siteRoot !== targetRoot;
}

