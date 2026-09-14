import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { DocumentEditError, updateDraftDocument } from "@/domain/content/documents";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.read");
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const version = await prisma.lessonVersion.findUnique({
    where: { id },
    include: { documentV1: true, documentV2: true, documentV3: true },
  });
  if (!version) return apiError(404, "NOT_FOUND", "Lesson version not found.");
  return apiSuccess(version);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("blocks" in body)) {
    return apiError(400, "BAD_REQUEST", "A blocks payload is required.");
  }
  const { schemaVersion, blocks } = body as { schemaVersion?: unknown; blocks: unknown };
  if (schemaVersion !== 1 && schemaVersion !== 2 && schemaVersion !== 3) {
    return apiError(400, "BAD_REQUEST", "schemaVersion must be 1, 2, or 3.");
  }
  if (schemaVersion === 1 && !Array.isArray(blocks)) {
    return apiError(400, "BAD_REQUEST", "A blocks array is required for schemaVersion 1.");
  }

  const { id } = await context.params;
  try {
    const version = await updateDraftDocument({ lessonVersionId: id, schemaVersion, blocks, actorId: auth.actor.id });
    return apiSuccess(version);
  } catch (error) {
    if (error instanceof DocumentEditError) {
      return apiError(error.message === "Lesson version not found." ? 404 : 409, error.message === "Lesson version not found." ? "NOT_FOUND" : "CONFLICT", error.message);
    }
    if (error instanceof ZodError) {
      return apiError(400, "BAD_REQUEST", "One or more blocks failed validation.", { details: { issues: error.issues } });
    }
    throw error;
  }
}
