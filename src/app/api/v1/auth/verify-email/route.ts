import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { hashToken } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  token: z.string().min(20),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "Verification request is invalid.");

  const tokenHash = hashToken(parsed.data.token);
  const token = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (
    !token ||
    token.identifier !== parsed.data.email ||
    token.usedAt ||
    token.expires <= new Date()
  ) {
    return apiError(400, "BAD_REQUEST", "Verification token is invalid or expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: parsed.data.email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
  ]);

  return apiSuccess({ verified: true });
}
