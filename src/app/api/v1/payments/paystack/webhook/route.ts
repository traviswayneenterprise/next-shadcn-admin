import { createHash } from "node:crypto";

import { grantPaymentEntitlement, revokePaymentEntitlements } from "@/domain/commerce/entitlements";
import { apiError, apiSuccess } from "@/lib/api/response";
import { recordAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { verifyPaystackSignature, verifyPaystackTransaction } from "@/lib/payments/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return apiError(401, "UNAUTHENTICATED", "Webhook signature is invalid.");
  }
  const payload = JSON.parse(rawBody) as { event: string; data: { id?: number; reference?: string } };
  const providerEventId = String(payload.data.id ?? createHash("sha256").update(rawBody).digest("hex"));
  const existing = await prisma.paymentEvent.findUnique({ where: { providerEventId } });
  if (existing) return apiSuccess({ received: true, duplicate: true });

  const payment = payload.data.reference
    ? await prisma.payment.findUnique({ where: { providerReference: payload.data.reference } })
    : null;
  const event = await prisma.paymentEvent.create({
    data: { paymentId: payment?.id, providerEventId, eventType: payload.event, payload, status: "PROCESSING" },
  });
  if (!payment) {
    await prisma.paymentEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date() } });
    return apiSuccess({ received: true });
  }

  try {
    if (payload.event === "charge.success") {
      const verified = await verifyPaystackTransaction(payment.providerReference);
      if (verified.status !== "success" || verified.amount !== payment.amount || verified.currency !== payment.currency) {
        throw new Error("Verified Paystack transaction does not match the payment quote.");
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED", paidAt: verified.paid_at ? new Date(verified.paid_at) : new Date() },
        });
        await grantPaymentEntitlement(transaction, payment.id);
        await transaction.paymentEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
      });
    } else if (payload.event === "charge.dispute.create") {
      await prisma.$transaction(async (transaction) => {
        await transaction.payment.update({ where: { id: payment.id }, data: { status: "DISPUTED" } });
        await recordAuditEvent(
          {
            action: "payment.dispute.opened",
            resourceType: "Payment",
            resourceId: payment.id,
            correlationId: event.id,
            metadata: { paystackEvent: payload.event },
          },
          transaction,
        );
        await transaction.paymentEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
      });
    } else if (["refund.processed", "charge.dispute.resolve"].includes(payload.event)) {
      const isChargeback = payload.event === "charge.dispute.resolve";
      await prisma.$transaction(async (transaction) => {
        await transaction.payment.update({ where: { id: payment.id }, data: { status: isChargeback ? "CHARGEBACK" : "REFUNDED" } });
        await revokePaymentEntitlements(transaction, payment.id, `Paystack event: ${payload.event}`);
        await recordAuditEvent(
          {
            action: isChargeback ? "payment.chargeback.confirmed" : "payment.refund.completed",
            resourceType: "Payment",
            resourceId: payment.id,
            correlationId: event.id,
            metadata: { paystackEvent: payload.event },
          },
          transaction,
        );
        await transaction.paymentEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
      });
    } else {
      await prisma.paymentEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date() } });
    }
    return apiSuccess({ received: true });
  } catch (error) {
    await prisma.paymentEvent.update({ where: { id: event.id }, data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown failure" } });
    throw error;
  }
}
