import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";

export const PASSWORD_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createDatabaseSession(userId: string) {
  const sessionToken = createOpaqueToken();
  const expires = new Date(Date.now() + PASSWORD_SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: { userId, sessionToken, expires },
  });

  return { sessionToken, expires };
}
