import { apiError, apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ trackSlug: string }> },
) {
  const { trackSlug } = await context.params;
  const track = await prisma.track.findFirst({
    where: { slug: trackSlug, status: "PUBLISHED", archivedAt: null },
    include: {
      imageAsset: { select: { key: true } },
      courses: { where: { status: "PUBLISHED", archivedAt: null }, orderBy: { order: "asc" }, select: { id: true, slug: true, title: true, order: true } },
      offerings: {
        where: { enabled: true, archivedAt: null },
        include: { prices: { where: { enabled: true, retiredAt: null }, orderBy: { currency: "asc" } } },
      },
    },
  });
  if (!track) return apiError(404, "NOT_FOUND", "Track not found.");
  return apiSuccess({
    id: track.id,
    slug: track.slug,
    title: track.title,
    description: track.description,
    imageUrl: track.imageAsset?.key ?? null,
    courses: track.courses,
    offerings: track.offerings.map((offering) => ({
      id: offering.id,
      kind: offering.kind,
      title: offering.title,
      prices: offering.prices.map((price) => ({ id: price.id, currency: price.currency, amount: price.amount, enabled: price.enabled })),
    })),
  });
}
