import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentSession } from "@/lib/auth/current-session";
import { AccessError, getLessonAccess } from "@/domain/content/progression";

export const runtime = "nodejs";

const LOCK_RESPONSE: Record<string, { status: number; code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" }> = {
  NO_ENTITLEMENT: { status: 403, code: "FORBIDDEN" },
  NOT_PUBLISHED: { status: 404, code: "NOT_FOUND" },
  LOCKED_SEQUENCE: { status: 423, code: "CONFLICT" },
  LOCKED_RELEASE_DATE: { status: 423, code: "CONFLICT" },
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHENTICATED", "Authentication required.");

  const { id } = await context.params;
  try {
    const access = await getLessonAccess({ userId: session.userId, lessonId: id });
    if (access.locked) {
      const response = LOCK_RESPONSE[access.reason] ?? { status: 403, code: "FORBIDDEN" as const };
      return apiError(response.status, response.code, access.message, { details: { reason: access.reason } });
    }
    return apiSuccess(access);
  } catch (error) {
    if (error instanceof AccessError) return apiError(404, "NOT_FOUND", error.message);
    throw error;
  }
}
