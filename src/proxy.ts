import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { isOriginProtectedPath, isSafeMethod, isTrustedOrigin } from "@/lib/auth/origin";
import { csrfCookieName, csrfHeaderName, sessionCookieName } from "@/lib/auth/cookie";
import { isValidCsrfToken, requiresCsrfCheck } from "@/lib/auth/csrf";

function corsHeaders(response: NextResponse, origin: string | null) {
  if (origin === env.LEARNER_ORIGIN) {
    response.headers.set("Access-Control-Allow-Origin", env.LEARNER_ORIGIN);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Headers",
    `Content-Type, Idempotency-Key, X-Correlation-Id, ${csrfHeaderName}`,
  );
  response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const requestOrigin = request.nextUrl.origin;
  const trustedOrigin = isTrustedOrigin(origin, requestOrigin, env.LEARNER_ORIGIN);

  if (request.method === "OPTIONS") {
    if (!trustedOrigin) return new NextResponse(null, { status: 403 });
    return corsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  const originProtected = isOriginProtectedPath(request.nextUrl.pathname);

  if (!isSafeMethod(request.method) && originProtected && !trustedOrigin) {
    return NextResponse.json(
      {
        error: { code: "FORBIDDEN", message: "Origin is not allowed." },
        meta: { correlationId: crypto.randomUUID(), timestamp: new Date().toISOString() },
      },
      { status: 403 },
    );
  }

  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);
  if (
    requiresCsrfCheck({ method: request.method, hasSessionCookie, isOriginProtectedPath: originProtected }) &&
    !isValidCsrfToken(request.cookies.get(csrfCookieName)?.value, request.headers.get(csrfHeaderName))
  ) {
    return NextResponse.json(
      {
        error: { code: "CSRF_TOKEN_INVALID", message: "A valid CSRF token is required." },
        meta: { correlationId: crypto.randomUUID(), timestamp: new Date().toISOString() },
      },
      { status: 403 },
    );
  }

  return corsHeaders(NextResponse.next(), origin);
}

export const config = {
  matcher: "/api/v1/:path*",
};
