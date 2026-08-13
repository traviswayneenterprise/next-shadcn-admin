import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function corsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", env.LEARNER_ORIGIN);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-CSRF-Token");
  response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    if (origin !== env.LEARNER_ORIGIN) return new NextResponse(null, { status: 403 });
    return corsHeaders(new NextResponse(null, { status: 204 }));
  }

  if (!safeMethods.has(request.method) && origin && origin !== env.LEARNER_ORIGIN) {
    return NextResponse.json(
      {
        error: { code: "FORBIDDEN", message: "Origin is not allowed." },
        meta: { correlationId: crypto.randomUUID(), timestamp: new Date().toISOString() },
      },
      { status: 403 },
    );
  }

  return corsHeaders(NextResponse.next());
}

export const config = {
  matcher: "/api/v1/:path*",
};
