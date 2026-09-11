import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { listDocs } from "@/lib/docs";

export const runtime = "nodejs";

// Deliberately outside /api/v1: this is a server-to-server call from the
// learner frontend's own Next.js server (never the browser), not a public
// contract endpoint, so it doesn't need CORS/Origin handling - just a shared
// secret so the URL alone isn't enough to read internal project docs.
export async function GET(request: Request) {
  if (!env.INTERNAL_DOCS_TOKEN || request.headers.get("authorization") !== `Bearer ${env.INTERNAL_DOCS_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = await listDocs();
  return NextResponse.json({ docs });
}
