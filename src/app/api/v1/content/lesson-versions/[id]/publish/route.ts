import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { publishLessonVersion } from "@/domain/content/publication";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.publish");
  if (auth.response) return auth.response;

  const { id } = await context.params;
  try {
    const version = await publishLessonVersion(id, auth.actor.id);
    return apiSuccess(version);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(409, "CONFLICT", "The document failed validation and cannot be published.", { details: { issues: error.issues } });
    }
    if (error instanceof Error) {
      return apiError(error.message === "Lesson version not found." ? 404 : 409, error.message === "Lesson version not found." ? "NOT_FOUND" : "CONFLICT", error.message);
    }
    throw error;
  }
}
