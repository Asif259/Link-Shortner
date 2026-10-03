/**
 * Resolves the base URL for short link redirection and copying.
 * 
 * Order of precedence:
 * 1. NEXT_PUBLIC_SHORT_URL (explicitly configured short domain or proxy)
 * 2. In browser: window.location.origin (frontend Vercel/custom domain)
 * 3. Fallback: http://localhost:3000
 */
export function getShortBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SHORT_URL) {
    return process.env.NEXT_PUBLIC_SHORT_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * Extracts a concise hostname for table display.
 * E.g. 'link-shortner-4je2.onrender.com' -> 'onrender.com' or truncated
 */
export function getDisplayHost(urlOrHost: string): string {
  try {
    const host = urlOrHost.replace(/^https?:\/\//, '').split('/')[0];
    if (host.length > 20) {
      // If it's a long onrender subdomain, keep the distinguishing prefix and domain
      const parts = host.split('.');
      if (parts.length >= 3 && parts.slice(-2).join('.') === 'onrender.com') {
        const sub = parts[0];
        const shortSub = sub.length > 12 ? `${sub.slice(0, 10)}…` : sub;
        return `${shortSub}.onrender.com`;
      }
      return `${host.slice(0, 18)}…`;
    }
    return host;
  } catch {
    return urlOrHost;
  }
}

/**
 * Formats a short code into a full clickable URL.
 */
export function formatShortUrl(shortCode: string, baseUrl?: string): string {
  const cleanBase = (baseUrl || getShortBaseUrl()).replace(/\/+$/, '');
  const cleanCode = (shortCode || '').replace(/^\/+/, '');
  return `${cleanBase}/${cleanCode}`;
}
