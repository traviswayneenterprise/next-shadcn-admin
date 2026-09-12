import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizationErrorResponse, requirePermission } from "@/lib/auth/authorize";
import { getRequestSecurityContext } from "@/lib/auth/request-security";
import { recordAuditEvent } from "@/lib/audit";
import { grantManualEntitlement } from "@/domain/commerce/entitlements";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const inputSchema = z
  .object({
    userId: z.string().min(1),
    reason: z.string().min(3).max(500),
    trackId: z.string().min(1).nullable().optional(),
    courseId: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Boolean(value.trackId) || Boolean(value.courseId), {
    message: "A trackId or courseId is required.",
  });

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requirePermission("entitlements.manage");
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiError(500, "INTERNAL_ERROR", "Authorization check failed.");
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A recipient, reason, and track or course are required.");

  const recipient = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
  if (!recipient) return apiError(404, "NOT_FOUND", "Recipient not found.");

  const security = getRequestSecurityContext(request);
  const entitlement = await prisma.$transaction(async (transaction) => {
    const created = await grantManualEntitlement(transaction, {
      userId: parsed.data.userId,
      grantedById: actor.id,
      reason: parsed.data.reason,
      trackId: parsed.data.trackId,
      courseId: parsed.data.courseId,
    });
    await recordAuditEvent(
      {
        actorId: actor.id,
        action: "entitlement.manual_grant.created",
        resourceType: "Entitlement",
        resourceId: created.id,
        correlationId: security.correlationId,
        ipAddress: security.ipAddress,
        userAgent: security.userAgent,
        metadata: { userId: parsed.data.userId, reason: parsed.data.reason },
      },
      transaction,
    );
    return created;
  });

  return apiSuccess({ entitlementId: entitlement.id, status: entitlement.status }, { status: 201 });
}
