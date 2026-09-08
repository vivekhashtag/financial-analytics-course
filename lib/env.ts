/**
 * Environment-variable normalisation.
 *
 * These values are pasted into a Vercel dashboard by a human, so they arrive in
 * whatever shape was on the clipboard. Nothing here may throw: a malformed
 * value must degrade the feature it powers, never fail the build.
 *
 * That is not hypothetical — `metadataBase: new URL(process.env.…)` in
 * app/layout.tsx threw `TypeError: Invalid URL` on a bare hostname (the
 * natural thing to paste from a browser bar) and killed the whole build.
 */

/**
 * The production origin, or null.
 *
 * Accepts what people actually paste: a full URL, a bare hostname, with or
 * without a trailing slash. Anything unusable returns null rather than throwing.
 */
export function siteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;

  // A bare hostname has no scheme; assume https rather than rejecting it.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withScheme);
    // Guard against values that parse but are meaningless as an origin,
    // e.g. "vivekhashtag/financial-analytics-course" -> https://vivekhashtag/...
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Same value as a `URL`, for Next's `metadataBase`. Null when unusable. */
export function siteUrlObject(): URL | null {
  const origin = siteUrl();
  if (!origin) return null;
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

/**
 * `org/repo` for Colab's GitHub importer, or null.
 *
 * Tolerates a pasted full GitHub URL, a `.git` suffix and stray slashes, since
 * all three are things someone reasonably copies.
 */
export function colabRepo(): string | null {
  const raw = process.env.NEXT_PUBLIC_COLAB_REPO?.trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');

  // Must be exactly owner/repo.
  return /^[\w.-]+\/[\w.-]+$/.test(cleaned) ? cleaned : null;
}

export function colabBranch(): string {
  return process.env.NEXT_PUBLIC_COLAB_BRANCH?.trim() || 'main';
}
