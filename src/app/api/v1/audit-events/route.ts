import { apiError, apiSuccessPage } from "@/lib/api/response";
import { authorizationErrorResponse, requirePermission } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    await requirePermission("operations.read");
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiError(500, "INTERNAL_ERROR", "Authorization check failed.");
  }

  const url = new URL(request.url);
  const resourceType = url.searchParams.get("resourceType");
  const resourceId = url.searchParams.get("resourceId");
  const correlationId = url.searchParams.get("correlationId");
  const cursor = url.searchParams.get("cursor");

  const events = await prisma.auditEvent.findMany({
    where: {
      ...(resourceType ? { resourceType } : {}),
      ...(resourceId ? { resourceId } : {}),
      ...(correlationId ? { correlationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { actor: { select: { id: true, name: true, email: true } } },
  });

  const hasMore = events.length > PAGE_SIZE;
  const page = events.slice(0, PAGE_SIZE);

  return apiSuccessPage(
    page.map((event) => ({
      id: event.id,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      correlationId: event.correlationId,
      actor: event.actor ? { id: event.actor.id, name: event.actor.name, email: event.actor.email } : null,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
    { nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
  );
}
