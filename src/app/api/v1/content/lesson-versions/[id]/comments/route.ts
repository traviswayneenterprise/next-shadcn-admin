import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { addLessonVersionComment, listLessonVersionComments } from "@/domain/content/comments";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.read");
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const comments = await listLessonVersionComments(id);
  return apiSuccess(comments);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return apiError(400, "BAD_REQUEST", "A non-empty comment body is required.");
  if (text.length > 4000) return apiError(400, "BAD_REQUEST", "Comment is too long (4000 characters max).");

  const { id } = await context.params;
  const comment = await addLessonVersionComment({ lessonVersionId: id, authorId: auth.actor.id, body: text });
  return apiSuccess(comment, { status: 201 });
}
