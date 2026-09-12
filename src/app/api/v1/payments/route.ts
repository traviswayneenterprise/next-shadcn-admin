import { apiError, apiSuccessPage } from "@/lib/api/response";
import { getCurrentSession } from "@/lib/auth/current-session";
import { requirePermission } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHENTICATED", "Authentication required.");

  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get("userId");
  const status = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");

  let userId = session.userId;
  if (requestedUserId && requestedUserId !== session.userId) {
    try {
      await requirePermission("payments.read");
    } catch {
      return apiError(403, "FORBIDDEN", "Missing permission: payments.read");
    }
    userId = requestedUserId;
  }

  const payments = await prisma.payment.findMany({
    where: { userId, ...(status ? { status: status as never } : {}) },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { offering: { select: { title: true } }, refunds: true },
  });

  const hasMore = payments.length > PAGE_SIZE;
  const page = payments.slice(0, PAGE_SIZE);

  return apiSuccessPage(
    page.map((payment) => ({
      id: payment.id,
      offeringTitle: payment.offering.title,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      refund: payment.refunds[0]
        ? { status: payment.refunds[0].status, createdAt: payment.refunds[0].createdAt.toISOString() }
        : null,
    })),
    { nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
  );
}
