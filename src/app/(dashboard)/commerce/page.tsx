import { redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { CommerceClient } from "./commerce-client"

export default async function CommercePage() {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")

  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("payments.read")) redirect("/403")

  const [payments, auditEvents, tracks] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true, name: true } },
        offering: { select: { title: true } },
        refunds: true,
      },
    }),
    prisma.auditEvent.findMany({
      where: { resourceType: { in: ["Payment", "Entitlement"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { actor: { select: { email: true, name: true } } },
    }),
    prisma.track.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ])

  return (
    <CommerceClient
      canManagePayments={permissions.includes("payments.manage")}
      canManageEntitlements={permissions.includes("entitlements.manage")}
      tracks={tracks}
      payments={payments.map((payment) => ({
        id: payment.id,
        userEmail: payment.user.email,
        offeringTitle: payment.offering.title,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt.toISOString(),
        hasRefund: payment.refunds.length > 0,
      }))}
      auditEvents={auditEvents.map((event) => ({
        id: event.id,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        actorEmail: event.actor?.email ?? null,
        createdAt: event.createdAt.toISOString(),
      }))}
    />
  )
}
