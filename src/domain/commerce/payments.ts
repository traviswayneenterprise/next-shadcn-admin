import { prisma } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { grantPaymentEntitlement } from "@/domain/commerce/entitlements";

/**
 * Direct-verification fallback for when the redirect return happens before
 * (or without) a webhook delivery. Idempotent: a payment already resolved
 * out of PENDING is returned as-is without a second Paystack call.
 */
export async function reconcilePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return payment;

  if (payment.expiresAt && payment.expiresAt <= new Date()) {
    return prisma.payment.update({ where: { id: payment.id }, data: { status: "CANCELLED" } });
  }

  const verified = await verifyPaystackTransaction(payment.providerReference).catch(() => null);
  if (!verified) return payment;

  if (verified.status === "success" && verified.amount === payment.amount && verified.currency === payment.currency) {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", paidAt: verified.paid_at ? new Date(verified.paid_at) : new Date() },
      });
      await grantPaymentEntitlement(transaction, payment.id);
      return updated;
    });
  }

  if (verified.status === "failed" || verified.status === "abandoned") {
    return prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }

  return payment;
}
