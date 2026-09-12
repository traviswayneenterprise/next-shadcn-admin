import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { resolveReusableBlockSnapshot, ReusableBlockError } from "@/domain/content/reusable-blocks";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const { id } = await context.params;
  try {
    const block = await resolveReusableBlockSnapshot(id);
    return apiSuccess(block);
  } catch (error) {
    if (error instanceof ReusableBlockError) return apiError(404, "NOT_FOUND", error.message);
    throw error;
  }
}
