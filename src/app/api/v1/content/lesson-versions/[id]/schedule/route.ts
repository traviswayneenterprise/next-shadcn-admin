import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { AccessError, scheduleLessonVersion } from "@/domain/content/progression";

export const runtime = "nodejs";

const inputSchema = z.object({ scheduledFor: z.string().datetime() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize("content.publish");
  if (auth.response) return auth.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A future scheduledFor timestamp is required.");

  const { id } = await context.params;
  try {
    const version = await scheduleLessonVersion(id, new Date(parsed.data.scheduledFor));
    return apiSuccess(version);
  } catch (error) {
    if (error instanceof AccessError) return apiError(404, "NOT_FOUND", error.message);
    if (error instanceof Error) return apiError(409, "CONFLICT", error.message);
    throw error;
  }
}
