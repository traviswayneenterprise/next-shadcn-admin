const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function generateCsrfToken() {
  return crypto.randomUUID();
}

/**
 * CSRF is only meaningful once a session cookie already grants ambient
 * authority. Pre-session writes (register, password-login, forgot-password)
 * have nothing to hijack yet and remain protected by Origin checks and rate
 * limits alone.
 */
export function requiresCsrfCheck(params: {
  method: string;
  hasSessionCookie: boolean;
  isOriginProtectedPath: boolean;
}) {
  return (
    params.hasSessionCookie &&
    params.isOriginProtectedPath &&
    !SAFE_METHODS.has(params.method.toUpperCase())
  );
}

export function isValidCsrfToken(cookieValue: string | null | undefined, headerValue: string | null | undefined) {
  if (!cookieValue || !headerValue) return false;
  return cookieValue === headerValue;
}
