import { hash } from "argon2";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { createOpaqueToken, hashToken } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/notifications/email";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "BAD_REQUEST", "Registration details are invalid.", {
      details: { fields: parsed.error.flatten().fieldErrors },
    });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return apiError(409, "CONFLICT", "An account already exists for this email.");
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

  const verificationUrl = new URL("/verify-email", env.LEARNER_ORIGIN);
  verificationUrl.searchParams.set("token", verificationToken);
  verificationUrl.searchParams.set("email", parsed.data.email);

  await sendTransactionalEmail({
    to: parsed.data.email,
    subject: "Verify your TWE Learning account",
    html: `<p>Welcome to TWE Learning.</p><p><a href="${verificationUrl.toString()}">Verify your email address</a>. This link expires in 24 hours.</p>`,
  });

  return apiSuccess({ requiresEmailVerification: true }, { status: 201 });
}
