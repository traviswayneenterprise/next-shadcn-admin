import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const rows = await prisma.track.findMany({
    where: { status: "PUBLISHED", archivedAt: null },
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, slug: true, title: true, description: true, imageAsset: { select: { key: true } } },
  });
  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map(({ imageAsset, ...track }) => ({
    ...track,
    imageUrl: imageAsset?.key ?? null,
  }));
  return apiSuccess(data, {
    headers: {
      "X-Next-Cursor": hasMore ? data.at(-1)?.id ?? "" : "",
      "X-Has-More": String(hasMore),
    },
  });
}
