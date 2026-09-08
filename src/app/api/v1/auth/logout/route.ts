import { cookies } from "next/headers";

import { apiSuccess } from "@/lib/api/response";
import { csrfCookieName, csrfCookieOptions, sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { hashToken } from "@/lib/auth/password-session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { sessionToken: { in: [hashToken(token), token] }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const response = apiSuccess({ loggedOut: true });
  response.cookies.set(sessionCookieName, "", {
    ...sessionCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(csrfCookieName, "", {
    ...csrfCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
