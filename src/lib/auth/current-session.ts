import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/cookie";
import { hashToken } from "@/lib/auth/password-session";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: { sessionToken: { in: [hashToken(token), token] } },
    include: { user: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expires <= new Date() ||
    session.user.status !== "ACTIVE"
  ) {
    return null;
  }

  return session;
}
