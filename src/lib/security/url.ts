// =============================================================================
// URL sanitization. External data (RSS feeds, future APIs) can supply link
// targets. Rendering an attacker-controlled href like `javascript:...` or
// `data:...` would be a link-based XSS vector, so any URL that ends up in an
// <a href> MUST pass through here first. Only http(s) and same-app relative
// links are allowed; everything else collapses to a safe placeholder.
// =============================================================================

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/** True for absolute http(s) URLs or same-app relative paths ("/news"). */
export function isSafeHttpUrl(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const value = raw.trim();
  if (value === "") return false;
  // Same-app relative link (but not protocol-relative "//evil.com").
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns the URL if safe, otherwise a harmless fallback ("#" by default).
 * Use everywhere an externally-sourced value is placed into an href.
 */
export function safeUrl(
  raw: string | undefined | null,
  fallback = "#",
): string {
  return isSafeHttpUrl(raw) ? raw!.trim() : fallback;
}
