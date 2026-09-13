"use server"

import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { AuthorizationError, requirePermission } from "@/lib/auth/authorize"
import type { RequestSecurityContext } from "@/lib/auth/request-security"
import { initiateRefund, RefundError } from "@/domain/commerce/refunds"
import { createManualGrant, ManualGrantError } from "@/domain/commerce/entitlements"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

async function serverActionSecurityContext(): Promise<RequestSecurityContext> {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
  return {
    correlationId: randomUUID(),
    ipAddress: forwardedFor || requestHeaders.get("x-real-ip") || "unknown",
    userAgent: requestHeaders.get("user-agent")?.slice(0, 500) || null,
  }
}

export async function refundPaymentAction(
  paymentId: string,
  reason: string,
): Promise<ActionResult<{ refundId: string; status: string }>> {
  try {
    const actor = await requirePermission("payments.manage")
    const refund = await initiateRefund({
      actorId: actor.id,
      paymentId,
      reason,
      security: await serverActionSecurityContext(),
    })
    revalidatePath("/commerce")
    return { success: true, data: { refundId: refund.id, status: refund.status } }
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof RefundError) {
      return { success: false, error: error.message }
    }
    throw error
  }
}

export async function createManualGrantAction(input: {
  recipientEmail: string
  reason: string
  trackId?: string | null
  courseId?: string | null
}): Promise<ActionResult<{ entitlementId: string; status: string }>> {
  try {
    const actor = await requirePermission("entitlements.manage")
    const entitlement = await createManualGrant({
      actorId: actor.id,
      recipientEmail: input.recipientEmail,
      reason: input.reason,
      trackId: input.trackId,
      courseId: input.courseId,
      security: await serverActionSecurityContext(),
    })
    revalidatePath("/commerce")
    return { success: true, data: { entitlementId: entitlement.id, status: entitlement.status } }
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof ManualGrantError) {
      return { success: false, error: error.message }
    }
    throw error
  }
}
