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
