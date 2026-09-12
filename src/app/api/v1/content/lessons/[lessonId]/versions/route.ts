import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { createDraftLessonVersion, DocumentEditError } from "@/domain/content/documents";

export const runtime = "nodejs";

const inputSchema = z.object({ forkFromVersionId: z.string().min(1).optional() });

export async function POST(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "Invalid request body.");

  const { lessonId } = await context.params;
  try {
    const version = await createDraftLessonVersion({
      lessonId,
      actorId: auth.actor.id,
      forkFromVersionId: parsed.data.forkFromVersionId,
    });
    return apiSuccess(version, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentEditError) return apiError(404, "NOT_FOUND", error.message);
    throw error;
  }
}
