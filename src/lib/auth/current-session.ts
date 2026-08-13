import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/cookie";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expires <= new Date()) {
    return null;
  }

  return session;
}
