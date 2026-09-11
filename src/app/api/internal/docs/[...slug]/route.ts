import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { readDoc } from "@/lib/docs";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
) {
  if (!env.INTERNAL_DOCS_TOKEN || request.headers.get("authorization") !== `Bearer ${env.INTERNAL_DOCS_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const content = await readDoc(slug);
  if (content === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ content });
}
