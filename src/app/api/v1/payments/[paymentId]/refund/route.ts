import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizationErrorResponse, requirePermission } from "@/lib/auth/authorize";
import { getRequestSecurityContext } from "@/lib/auth/request-security";
import { initiateRefund, RefundError } from "@/domain/commerce/refunds";

export const runtime = "nodejs";

const inputSchema = z.object({ reason: z.string().min(3).max(500) });

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  let actor;
  try {
    actor = await requirePermission("payments.manage");
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiError(500, "INTERNAL_ERROR", "Authorization check failed.");
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A refund reason is required.");

  const { paymentId } = await context.params;
  try {
    const refund = await initiateRefund({
      actorId: actor.id,
      paymentId,
      reason: parsed.data.reason,
      security: getRequestSecurityContext(request),
    });
    return apiSuccess({ refundId: refund.id, status: refund.status }, { status: 202 });
  } catch (error) {
    if (error instanceof RefundError) {
      return apiError(error.message === "Payment not found." ? 404 : 409, error.message === "Payment not found." ? "NOT_FOUND" : "CONFLICT", error.message);
    }
    throw error;
  }
}
