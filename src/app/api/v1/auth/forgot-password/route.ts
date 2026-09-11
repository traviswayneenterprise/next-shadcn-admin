import { z } from "zod";

import { apiSuccess } from "@/lib/api/response";
import { createOpaqueToken, hashToken } from "@/lib/auth/password-session";
import { enforceAuthRateLimit, recordAuthEvent } from "@/lib/auth/request-security";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/notifications/email";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await enforceAuthRateLimit({
    request,
    type: "AUTH_PASSWORD_RESET",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  const email = parsed.success ? parsed.data.email : "invalid";
  const user = parsed.success
    ? await prisma.user.findUnique({ where: { email }, include: { credential: true } })
    : null;

  if (user?.credential && user.status === "ACTIVE") {
    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
      }),
    ]);

    const resetUrl = new URL("/auth/reset-password", env.LEARNER_ORIGIN);
    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("email", user.email);
    await sendTransactionalEmail({
      to: user.email,
      subject: "Reset your TWE Learning password",
      html: `<p><a href="${resetUrl.toString()}">Reset your password</a>. This link expires in one hour.</p>`,
    }).catch((error) => {
      // Intentionally still respond as accepted either way - this endpoint
      // must not reveal delivery outcomes to the caller - but a delivery
      // failure should not disappear from the server logs entirely.
      console.error(`[${rateLimit.context.correlationId}] AUTH_PASSWORD_RESET email failed:`, error);
    });
  }

  await recordAuthEvent({
    context: rateLimit.context,
    type: "AUTH_PASSWORD_RESET",
    outcome: "REQUEST_ACCEPTED",
    userId: user?.id,
    identifier: email,
  });
  return apiSuccess(
    { accepted: true },
    { correlationId: rateLimit.context.correlationId },
  );
}
