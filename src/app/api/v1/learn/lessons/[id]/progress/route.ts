import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentSession } from "@/lib/auth/current-session";
import { AccessError, updateLessonProgress } from "@/domain/content/progression";

export const runtime = "nodejs";

const inputSchema = z.object({ action: z.enum(["start", "complete"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHENTICATED", "Authentication required.");

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A valid action is required.");

  const { id } = await context.params;
  try {
    const progress = await updateLessonProgress({ userId: session.userId, lessonId: id, action: parsed.data.action });
    return apiSuccess(progress);
  } catch (error) {
    if (error instanceof AccessError) return apiError(403, "FORBIDDEN", error.message, { details: { reason: error.code } });
    throw error;
  }
}
