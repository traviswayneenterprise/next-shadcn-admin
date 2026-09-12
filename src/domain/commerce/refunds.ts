import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { refundPaystackTransaction } from "@/lib/payments/paystack";
import type { RequestSecurityContext } from "@/lib/auth/request-security";

export class RefundError extends Error {}

export async function initiateRefund(input: {
  actorId: string;
  paymentId: string;
  reason: string;
  security: RequestSecurityContext;
}) {
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId } });
  if (!payment) throw new RefundError("Payment not found.");
  if (payment.status !== "SUCCEEDED") throw new RefundError("Only successful payments can be refunded.");

  const existing = await prisma.refund.findFirst({ where: { paymentId: payment.id } });
  if (existing) throw new RefundError("This payment already has a refund on record.");

  const refunded = await refundPaystackTransaction({
    reference: payment.providerReference,
    amount: payment.amount,
    merchantNote: input.reason,
  });

  return prisma.$transaction(async (transaction) => {
    const record = await transaction.refund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: String(refunded.id),
        amount: payment.amount,
        reason: input.reason,
        status: refunded.status,
      },
    });
    await recordAuditEvent(
      {
        actorId: input.actorId,
        action: "payment.refund.initiated",
        resourceType: "Payment",
        resourceId: payment.id,
        correlationId: input.security.correlationId,
        ipAddress: input.security.ipAddress,
        userAgent: input.security.userAgent,
        metadata: { refundId: record.id, reason: input.reason },
      },
      transaction,
    );
    return record;
  }, TRANSACTION_OPTIONS);
}
