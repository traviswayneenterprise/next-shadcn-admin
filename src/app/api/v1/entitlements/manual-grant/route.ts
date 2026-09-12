import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizationErrorResponse, requirePermission } from "@/lib/auth/authorize";
import { getRequestSecurityContext } from "@/lib/auth/request-security";
import { createManualGrant, ManualGrantError } from "@/domain/commerce/entitlements";

export const runtime = "nodejs";

const inputSchema = z
  .object({
    recipientEmail: z.string().email(),
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
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A recipient email, reason, and track or course are required.");

  try {
    const entitlement = await createManualGrant({
      actorId: actor.id,
      recipientEmail: parsed.data.recipientEmail,
      reason: parsed.data.reason,
      trackId: parsed.data.trackId,
      courseId: parsed.data.courseId,
      security: getRequestSecurityContext(request),
    });
    return apiSuccess({ entitlementId: entitlement.id, status: entitlement.status }, { status: 201 });
  } catch (error) {
    if (error instanceof ManualGrantError) return apiError(404, "NOT_FOUND", error.message);
    throw error;
  }
}
