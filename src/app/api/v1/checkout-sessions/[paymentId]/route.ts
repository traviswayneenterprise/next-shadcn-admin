import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentSession } from "@/lib/auth/current-session";
import { prisma } from "@/lib/db";
import { reconcilePayment } from "@/domain/commerce/payments";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHENTICATED", "Authentication required.");

  // The path segment is either our internal payment id or the Paystack
  // `reference` we generated at checkout - that's the only identifier
  // Paystack's redirect callback actually echoes back to the browser.
  const { paymentId: pathValue } = await context.params;
  const lookup = await prisma.payment.findFirst({
    where: { OR: [{ id: pathValue }, { providerReference: pathValue }] },
    select: { id: true },
  });
  const payment = lookup ? await reconcilePayment(lookup.id) : null;
  if (!payment || payment.userId !== session.userId) {
    return apiError(404, "NOT_FOUND", "Payment not found.");
  }

  return apiSuccess({
    paymentId: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    paidAt: payment.paidAt?.toISOString() ?? null,
  });
}
