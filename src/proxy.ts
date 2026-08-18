import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { isOriginProtectedPath, isSafeMethod, isTrustedOrigin } from "@/lib/auth/origin";

function corsHeaders(response: NextResponse, origin: string | null) {
  if (origin === env.LEARNER_ORIGIN) {
    response.headers.set("Access-Control-Allow-Origin", env.LEARNER_ORIGIN);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-Correlation-Id");
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

  if (
    !isSafeMethod(request.method) &&
    isOriginProtectedPath(request.nextUrl.pathname) &&
    !trustedOrigin
  ) {
    return NextResponse.json(
      {
        error: { code: "FORBIDDEN", message: "Origin is not allowed." },
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
