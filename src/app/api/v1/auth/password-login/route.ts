import { verify } from "argon2";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { csrfCookieName, csrfCookieOptions, sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { generateCsrfToken } from "@/lib/auth/csrf";
import { createDatabaseSession, PASSWORD_SESSION_TTL_SECONDS } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";
import { enforceAuthRateLimit, recordAuthEvent } from "@/lib/auth/request-security";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await enforceAuthRateLimit({
    request,
    type: "AUTH_LOGIN",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    await recordAuthEvent({ context: rateLimit.context, type: "AUTH_LOGIN", outcome: "INVALID_INPUT" });
    return apiError(400, "BAD_REQUEST", "Login details are invalid.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

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
    await recordAuthEvent({
      context: rateLimit.context,
      type: "AUTH_LOGIN",
      outcome: "DENIED",
      userId: user?.id,
      identifier: parsed.data.email,
    });
    return apiError(401, "UNAUTHENTICATED", "Email or password is incorrect.", {
      correlationId: rateLimit.context.correlationId,
    });
  }

  const session = await createDatabaseSession(user.id);
  await recordAuthEvent({
    context: rateLimit.context,
    type: "AUTH_LOGIN",
    outcome: "SUCCEEDED",
    userId: user.id,
    identifier: user.email,
  });
  const response = apiSuccess({
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    expiresAt: session.expires.toISOString(),
  }, { correlationId: rateLimit.context.correlationId });
  response.cookies.set(sessionCookieName, session.sessionToken, {
    ...sessionCookieOptions,
    maxAge: PASSWORD_SESSION_TTL_SECONDS,
    expires: session.expires,
  });
  response.cookies.set(csrfCookieName, generateCsrfToken(), {
    ...csrfCookieOptions,
    maxAge: PASSWORD_SESSION_TTL_SECONDS,
    expires: session.expires,
  });
  return response;
}
