import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { hashToken } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";
import { enforceAuthRateLimit, recordAuthEvent } from "@/lib/auth/request-security";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  token: z.string().min(20),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await enforceAuthRateLimit({
    request,
    type: "AUTH_VERIFY_EMAIL",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    await recordAuthEvent({ context: rateLimit.context, type: "AUTH_VERIFY_EMAIL", outcome: "INVALID_INPUT" });
    return apiError(400, "BAD_REQUEST", "Verification request is invalid.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  const tokenHash = hashToken(parsed.data.token);
  const token = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (
    !token ||
    token.identifier !== parsed.data.email ||
    token.usedAt ||
    token.expires <= new Date()
  ) {
    await recordAuthEvent({
      context: rateLimit.context,
      type: "AUTH_VERIFY_EMAIL",
      outcome: "DENIED",
      identifier: parsed.data.email,
    });
    return apiError(400, "BAD_REQUEST", "Verification token is invalid or expired.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  const verified = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.verificationToken.updateMany({
      where: { tokenHash, usedAt: null, expires: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;
    await transaction.user.update({
      where: { email: parsed.data.email },
      data: { emailVerified: new Date() },
    });
    return true;
  });

  if (!verified) {
    return apiError(400, "BAD_REQUEST", "Verification token is invalid or expired.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  await recordAuthEvent({
    context: rateLimit.context,
    type: "AUTH_VERIFY_EMAIL",
    outcome: "SUCCEEDED",
    identifier: parsed.data.email,
  });
  return apiSuccess({ verified: true }, { correlationId: rateLimit.context.correlationId });
}
