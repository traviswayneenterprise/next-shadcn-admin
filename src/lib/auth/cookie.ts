import { env } from "@/lib/env";

export const sessionCookieName =
  env.NODE_ENV === "production" ? "__Secure-twe.session-token" : "twe.session-token";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
  ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
} as const;

// Double-submit CSRF token. Deliberately readable by JavaScript (not HttpOnly)
// so the client can echo it back in the X-CSRF-Token header; the token itself
// grants no authority on its own, it only proves the request came from script
// that could read a same-site cookie rather than a cross-site form/link.
export const csrfCookieName =
  env.NODE_ENV === "production" ? "__Secure-twe.csrf-token" : "twe.csrf-token";

export const csrfHeaderName = "x-csrf-token";

export const csrfCookieOptions = {
  httpOnly: false,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
  ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
} as const;
