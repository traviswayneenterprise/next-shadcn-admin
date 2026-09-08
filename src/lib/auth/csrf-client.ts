"use client";

// Deliberately does not import "@/lib/auth/cookie" or "@/lib/env": those pull
// in server-only secrets (DB/Paystack/etc.) that must never enter a client
// bundle. The cookie name is re-derived here from the same __Secure- rule,
// keyed off the page's own protocol instead of NODE_ENV.
const CSRF_HEADER_NAME = "x-csrf-token";

function csrfCookieName() {
  const isSecureContext = typeof window !== "undefined" && window.location.protocol === "https:";
  return isSecureContext ? "__Secure-twe.csrf-token" : "twe.csrf-token";
}

/**
 * Reads the non-HttpOnly double-submit CSRF cookie so it can be echoed back
 * as a header on state-changing requests. Safe to call outside the browser
 * (returns {}); the cookie value itself carries no secret authority.
 */
export function getCsrfHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const name = csrfCookieName();
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}
