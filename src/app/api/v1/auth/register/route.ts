import { hash } from "argon2";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { createOpaqueToken, hashToken } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { enforceAuthRateLimit, recordAuthEvent } from "@/lib/auth/request-security";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await enforceAuthRateLimit({
    request,
    type: "AUTH_REGISTER",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    await recordAuthEvent({ context: rateLimit.context, type: "AUTH_REGISTER", outcome: "INVALID_INPUT" });
    return apiError(400, "BAD_REQUEST", "Registration details are invalid.", {
      correlationId: rateLimit.context.correlationId,
      details: { fields: parsed.error.flatten().fieldErrors },
    });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    await recordAuthEvent({
      context: rateLimit.context,
      type: "AUTH_REGISTER",
      outcome: "CONFLICT",
      userId: existing.id,
      identifier: parsed.data.email,
    });
    return apiError(409, "CONFLICT", "An account already exists for this email.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  const verificationToken = createOpaqueToken();
  const verificationTokenHash = hashToken(verificationToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        credential: { create: { passwordHash: await hash(parsed.data.password) } },
      },
    });

    await transaction.verificationToken.create({
      data: { identifier: user.email, tokenHash: verificationTokenHash, expires },
    });
  });

  const verificationUrl = new URL("/auth/verify-email", env.LEARNER_ORIGIN);
  verificationUrl.searchParams.set("token", verificationToken);
  verificationUrl.searchParams.set("email", parsed.data.email);

  try {
    await sendTransactionalEmail({
      to: parsed.data.email,
      subject: "Verify your TWE Learning account",
      html: `<p>Welcome to TWE Learning.</p><p><a href="${verificationUrl.toString()}">Verify your email address</a>. This link expires in 24 hours.</p>`,
    });
  } catch (error) {
    console.error(
      `[${rateLimit.context.correlationId}] AUTH_REGISTER verification email failed:`,
      error,
    );
    await recordAuthEvent({
      context: rateLimit.context,
      type: "AUTH_REGISTER",
      outcome: "EMAIL_FAILED",
      identifier: parsed.data.email,
    });
    return apiError(503, "INTERNAL_ERROR", "Your account was created, but the verification email could not be delivered. Request a new verification email before signing in.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  await recordAuthEvent({
    context: rateLimit.context,
    type: "AUTH_REGISTER",
    outcome: "SUCCEEDED",
    identifier: parsed.data.email,
  });
  return apiSuccess({ requiresEmailVerification: true }, {
    status: 201,
    correlationId: rateLimit.context.correlationId,
  });
}
