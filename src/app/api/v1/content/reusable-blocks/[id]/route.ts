import { z, ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { ReusableBlockError, updateReusableBlock } from "@/domain/content/reusable-blocks";

export const runtime = "nodejs";

const inputSchema = z.object({ blocks: z.array(z.unknown()).max(200) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A blocks array is required.");

  const { id } = await context.params;
  try {
    const reusableBlock = await updateReusableBlock({ reusableBlockId: id, blocks: parsed.data.blocks });
    return apiSuccess(reusableBlock);
  } catch (error) {
    if (error instanceof ReusableBlockError) return apiError(404, "NOT_FOUND", error.message);
    if (error instanceof ZodError) {
      return apiError(400, "BAD_REQUEST", "One or more blocks failed validation.", { details: { issues: error.issues } });
    }
    throw error;
  }
}
