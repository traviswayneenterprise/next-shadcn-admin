const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSafeMethod(method: string) {
  return SAFE_METHODS.has(method.toUpperCase());
}

export function isOriginProtectedPath(pathname: string) {
  return !pathname.startsWith("/api/v1/payments/paystack/webhook");
}

export function isTrustedOrigin(origin: string | null, requestOrigin: string, learnerOrigin: string) {
  return origin === requestOrigin || origin === learnerOrigin;
}
