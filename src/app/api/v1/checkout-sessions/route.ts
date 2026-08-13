import { randomBytes } from "node:crypto";

import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentSession } from "@/lib/auth/current-session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { initializePaystackTransaction } from "@/lib/payments/paystack";

const inputSchema = z.object({
  offeringId: z.string().min(1),
  priceId: z.string().min(1),
  cohortId: z.string().min(1).nullable().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHENTICATED", "Authentication required.");
  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || idempotencyKey.length < 16) {
    return apiError(400, "BAD_REQUEST", "A valid Idempotency-Key header is required.");
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "Checkout selection is invalid.");

  const prior = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (prior?.authorizationUrl && prior.expiresAt) {
    return apiSuccess({ paymentId: prior.id, authorizationUrl: prior.authorizationUrl, expiresAt: prior.expiresAt.toISOString() });
  }

  const price = await prisma.price.findFirst({
    where: { id: parsed.data.priceId, offeringId: parsed.data.offeringId, enabled: true, retiredAt: null },
    include: { offering: true },
  });
  if (!price || !price.offering.enabled || price.currency !== "NGN") {
    return apiError(409, "CONFLICT", "This price is not available for checkout.");
  }

  let cohortId: string | null = null;
  if (price.offering.kind === "MANAGED_COHORT") {
    if (!parsed.data.cohortId) return apiError(400, "BAD_REQUEST", "Select a cohort.");
    const cohort = await prisma.cohort.findFirst({
      where: { id: parsed.data.cohortId, offeringId: price.offering.id, status: "OPEN" },
      include: { _count: { select: { memberships: { where: { role: "LEARNER", status: "ACTIVE" } } } } },
    });
    if (!cohort || cohort._count.memberships >= cohort.capacity) {
      return apiError(409, "CONFLICT", "The selected cohort is no longer available.");
    }
    cohortId = cohort.id;
  }

  const reference = `twe_${Date.now()}_${randomBytes(8).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const payment = await prisma.payment.create({
    data: {
      userId: session.userId,
      offeringId: price.offeringId,
      priceId: price.id,
      cohortId,
      providerReference: reference,
      idempotencyKey,
      currency: price.currency,
      amount: price.amount,
      expiresAt,
    },
  });

  try {
    const callbackUrl = new URL("/payment/complete", env.LEARNER_ORIGIN).toString();
    const initialized = await initializePaystackTransaction({
      email: session.user.email,
      amount: price.amount,
      currency: price.currency,
      reference,
      callbackUrl,
      metadata: { paymentId: payment.id, userId: session.userId, offeringId: price.offeringId, cohortId },
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { authorizationUrl: initialized.authorization_url } });
    return apiSuccess({ paymentId: payment.id, authorizationUrl: initialized.authorization_url, expiresAt: expiresAt.toISOString() }, { status: 201 });
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw error;
  }
}
