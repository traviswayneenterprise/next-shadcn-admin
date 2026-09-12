import type { Prisma } from "@/generated/prisma/client";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import type { RequestSecurityContext } from "@/lib/auth/request-security";

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

export async function grantManualEntitlement(
  transaction: Prisma.TransactionClient,
  input: { userId: string; grantedById: string; reason: string; trackId?: string | null; courseId?: string | null },
) {
  const grant = await transaction.entitlementGrant.create({
    data: { userId: input.userId, grantedById: input.grantedById, reason: input.reason },
  });

  return transaction.entitlement.create({
    data: {
      userId: input.userId,
      trackId: input.trackId ?? undefined,
      courseId: input.courseId ?? undefined,
      source: "MANUAL_GRANT",
      grantId: grant.id,
    },
  });
}

export class ManualGrantError extends Error {}

export async function createManualGrant(input: {
  actorId: string;
  recipientEmail: string;
  reason: string;
  trackId?: string | null;
  courseId?: string | null;
  security: RequestSecurityContext;
}) {
  const recipient = await prisma.user.findUnique({
    where: { email: input.recipientEmail.trim().toLowerCase() },
    select: { id: true },
  });
  if (!recipient) throw new ManualGrantError("No user found with that email.");

  return prisma.$transaction(async (transaction) => {
    const created = await grantManualEntitlement(transaction, {
      userId: recipient.id,
      grantedById: input.actorId,
      reason: input.reason,
      trackId: input.trackId,
      courseId: input.courseId,
    });
    await recordAuditEvent(
      {
        actorId: input.actorId,
        action: "entitlement.manual_grant.created",
        resourceType: "Entitlement",
        resourceId: created.id,
        correlationId: input.security.correlationId,
        ipAddress: input.security.ipAddress,
        userAgent: input.security.userAgent,
        metadata: { userId: recipient.id, reason: input.reason },
      },
      transaction,
    );
    return created;
  }, TRANSACTION_OPTIONS);
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
