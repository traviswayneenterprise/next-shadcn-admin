import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizationErrorResponse, requirePermission } from "@/lib/auth/authorize";
import { recordAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getRequestSecurityContext } from "@/lib/auth/request-security";
import { refundPaystackTransaction } from "@/lib/payments/paystack";

export const runtime = "nodejs";

const inputSchema = z.object({ reason: z.string().min(3).max(500) });

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  let actor;
  try {
    actor = await requirePermission("payments.manage");
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiError(500, "INTERNAL_ERROR", "Authorization check failed.");
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A refund reason is required.");

  const { paymentId } = await context.params;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return apiError(404, "NOT_FOUND", "Payment not found.");
  if (payment.status !== "SUCCEEDED") {
    return apiError(409, "CONFLICT", "Only successful payments can be refunded.");
  }

  const existing = await prisma.refund.findFirst({ where: { paymentId: payment.id } });
  if (existing) return apiError(409, "CONFLICT", "This payment already has a refund on record.");

  const refunded = await refundPaystackTransaction({
    reference: payment.providerReference,
    amount: payment.amount,
    merchantNote: parsed.data.reason,
  });

  const security = getRequestSecurityContext(request);
  const refund = await prisma.$transaction(async (transaction) => {
    const record = await transaction.refund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: String(refunded.id),
        amount: payment.amount,
        reason: parsed.data.reason,
        status: refunded.status,
      },
    });
    await recordAuditEvent(
      {
        actorId: actor.id,
        action: "payment.refund.initiated",
        resourceType: "Payment",
        resourceId: payment.id,
        correlationId: security.correlationId,
        ipAddress: security.ipAddress,
        userAgent: security.userAgent,
        metadata: { refundId: record.id, reason: parsed.data.reason },
      },
      transaction,
    );
    return record;
  });

  return apiSuccess({ refundId: refund.id, status: refund.status }, { status: 202 });
}
