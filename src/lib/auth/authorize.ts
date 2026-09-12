import type { PermissionKey } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/current-session";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api/response";

type PermissionScope = { trackId?: string; cohortId?: string };

export class AuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
  }
}

export async function requirePermission(permission: PermissionKey, scope: PermissionScope = {}) {
  const session = await getCurrentSession();
  if (!session) throw new AuthorizationError("UNAUTHENTICATED", "Authentication required.");

  const assignments = await prisma.roleAssignment.findMany({
    where: {
      userId: session.userId,
      revokedAt: null,
      role: { permissions: { some: { permission: { key: permission } } } },
      OR: [
        { scopeType: "GLOBAL" },
        ...(scope.trackId ? [{ scopeType: "TRACK" as const, scopeTrackId: scope.trackId }] : []),
        ...(scope.cohortId ? [{ scopeType: "COHORT" as const, scopeCohortId: scope.cohortId }] : []),
      ],
    },
    select: { id: true },
    take: 1,
  });

  if (assignments.length === 0) {
    throw new AuthorizationError("FORBIDDEN", `Missing permission: ${permission}`);
  }

  return session.user;
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return apiError(error.code === "UNAUTHENTICATED" ? 401 : 403, error.code, error.message);
  }
  return null;
}
