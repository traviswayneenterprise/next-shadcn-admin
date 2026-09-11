import { hash } from "argon2";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { hashToken } from "@/lib/auth/password-session";
import { enforceAuthRateLimit, recordAuthEvent } from "@/lib/auth/request-security";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  token: z.string().min(20),
  password: z.string().min(12).max(128),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await enforceAuthRateLimit({
    request,
    type: "AUTH_PASSWORD_RESET",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    await recordAuthEvent({ context: rateLimit.context, type: "AUTH_PASSWORD_RESET", outcome: "INVALID_INPUT" });
    return apiError(400, "BAD_REQUEST", "Password reset request is invalid.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (
    !resetToken ||
    resetToken.user.email !== parsed.data.email ||
    resetToken.usedAt ||
    resetToken.expiresAt <= new Date()
  ) {
    await recordAuthEvent({
      context: rateLimit.context,
      type: "AUTH_PASSWORD_RESET",
      outcome: "DENIED",
      userId: resetToken?.userId,
      identifier: parsed.data.email,
    });
    return apiError(400, "BAD_REQUEST", "Password reset token is invalid or expired.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  const passwordHash = await hash(parsed.data.password);
  const reset = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;
    // upsert, not update: accounts created without a password yet (Google
    // OAuth sign-ups, or seeded accounts like the bootstrap Owner) have no
    // Credential row - "reset" is also how they set a password the first time.
    await transaction.credential.upsert({
      where: { userId: resetToken.userId },
      create: { userId: resetToken.userId, passwordHash },
      update: { passwordHash },
    });
    await transaction.session.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return true;
  });

  if (!reset) {
    return apiError(400, "BAD_REQUEST", "Password reset token is invalid or expired.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  await recordAuthEvent({
    context: rateLimit.context,
    type: "AUTH_PASSWORD_RESET",
    outcome: "SUCCEEDED",
    userId: resetToken.userId,
    identifier: parsed.data.email,
  });
  return apiSuccess({ reset: true }, { correlationId: rateLimit.context.correlationId });
}
