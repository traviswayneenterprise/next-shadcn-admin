import type { Prisma } from "@/generated/prisma/client";

export async function grantPaymentEntitlement(transaction: Prisma.TransactionClient, paymentId: string) {
  const payment = await transaction.payment.findUnique({
    where: { id: paymentId },
    include: { offering: true },
  });
  if (!payment) throw new Error("Payment not found.");
  if (payment.status !== "SUCCEEDED") throw new Error("Only successful payments grant access.");

  const existing = await transaction.entitlement.findFirst({
    where: { paymentId: payment.id, status: "ACTIVE" },
  });
  if (existing) return existing;

  const entitlement = await transaction.entitlement.create({
    data: {
      userId: payment.userId,
      trackId: payment.offering.trackId,
      courseId: payment.offering.courseId,
      source: "PAYMENT",
      paymentId: payment.id,
    },
  });

  if (payment.offering.trackId) {
    await transaction.enrollment.upsert({
      where: { userId_trackId: { userId: payment.userId, trackId: payment.offering.trackId } },
      update: { status: "ACTIVE", ...(payment.cohortId ? { cohortId: payment.cohortId } : {}) },
      create: { userId: payment.userId, trackId: payment.offering.trackId, cohortId: payment.cohortId },
    });
  }

  if (payment.cohortId) {
    await transaction.cohortMembership.upsert({
      where: { cohortId_userId_role: { cohortId: payment.cohortId, userId: payment.userId, role: "LEARNER" } },
      update: { status: "ACTIVE", joinedAt: new Date(), removedAt: null },
      create: { cohortId: payment.cohortId, userId: payment.userId, role: "LEARNER", status: "ACTIVE", joinedAt: new Date() },
    });
  }

  return entitlement;
}

export async function revokePaymentEntitlements(
  transaction: Prisma.TransactionClient,
  paymentId: string,
  reason: string,
) {
  return transaction.entitlement.updateMany({
    where: { paymentId, source: "PAYMENT", status: "ACTIVE" },
    data: { status: "REVOKED", revokedAt: new Date(), revokeReason: reason },
  });
}
