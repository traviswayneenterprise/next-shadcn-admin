import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { recordAuditEvent } from "@/lib/audit";
import { getRequestSecurityContext } from "@/lib/auth/request-security";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export const runtime = "nodejs";

const inputSchema = z.object({ status: z.enum(["APPROVED", "NEEDS_CORRECTION"]), note: z.string().max(2000).optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.publish");
  if (auth.response) return auth.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A review status is required.");

  const { id } = await context.params;
  const existing = await prisma.lessonVersion.findUnique({ where: { id } });
  if (!existing) return apiError(404, "NOT_FOUND", "Lesson version not found.");

  const security = getRequestSecurityContext(request);
  const version = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.lessonVersion.update({ where: { id }, data: { reviewStatus: parsed.data.status } });
    await recordAuditEvent(
      {
        actorId: auth.actor.id,
        action: parsed.data.status === "APPROVED" ? "lesson.version.review_approved" : "lesson.version.review_needs_correction",
        resourceType: "LessonVersion",
        resourceId: id,
        correlationId: security.correlationId,
        ipAddress: security.ipAddress,
        userAgent: security.userAgent,
        metadata: parsed.data.note ? { note: parsed.data.note } : undefined,
      },
      transaction,
    );
    return updated;
  }, TRANSACTION_OPTIONS);
  return apiSuccess(version);
}
