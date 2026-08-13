import { verify } from "argon2";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { createDatabaseSession, PASSWORD_SESSION_TTL_SECONDS } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "Login details are invalid.");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { credential: true },
  });

  if (
    !user?.credential ||
    !user.emailVerified ||
    user.status !== "ACTIVE" ||
    !(await verify(user.credential.passwordHash, parsed.data.password))
  ) {
    return apiError(401, "UNAUTHENTICATED", "Email or password is incorrect.");
  }

  const session = await createDatabaseSession(user.id);
  const response = apiSuccess({
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    expiresAt: session.expires.toISOString(),
  });
  response.cookies.set(sessionCookieName, session.sessionToken, {
    ...sessionCookieOptions,
    maxAge: PASSWORD_SESSION_TTL_SECONDS,
    expires: session.expires,
  });
  return response;
}
