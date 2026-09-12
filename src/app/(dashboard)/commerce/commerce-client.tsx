"use client"

import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeaderContainer } from "@/components/ui/header-container"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createManualGrantAction, refundPaymentAction } from "./actions"

type PaymentRow = {
  id: string
  userEmail: string
  offeringTitle: string
  status: string
  amount: number
  currency: string
  createdAt: string
  hasRefund: boolean
}

type AuditRow = {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  actorEmail: string | null
  createdAt: string
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  SUCCEEDED: "default",
  FAILED: "destructive",
  CANCELLED: "outline",
  REFUNDED: "secondary",
  DISPUTED: "secondary",
  CHARGEBACK: "destructive",
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount / 100)
}

export function CommerceClient({
  payments,
  auditEvents,
  tracks,
  canManagePayments,
  canManageEntitlements,
}: {
  payments: PaymentRow[]
  auditEvents: AuditRow[]
  tracks: { id: string; title: string }[]
  canManagePayments: boolean
  canManageEntitlements: boolean
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [refundReasons, setRefundReasons] = useState<Record<string, string>>({})
  const [refundingId, setRefundingId] = useState<string | null>(null)

  const [grantEmail, setGrantEmail] = useState("")
  const [grantTrackId, setGrantTrackId] = useState("")
  const [grantReason, setGrantReason] = useState("")

  function handleRefund(paymentId: string) {
    const reason = refundReasons[paymentId]?.trim()
    if (!reason || reason.length < 3) {
      toast({ title: "A refund reason is required", variant: "destructive" })
      return
    }
    setRefundingId(paymentId)
    startTransition(async () => {
      const result = await refundPaymentAction(paymentId, reason)
      setRefundingId(null)
      if (result.success) {
        toast({ title: "Refund initiated", description: `Status: ${result.data.status}` })
      } else {
        toast({ title: "Refund failed", description: result.error, variant: "destructive" })
      }
    })
  }

  function handleGrant() {
    if (!grantEmail.trim() || !grantTrackId || grantReason.trim().length < 3) {
      toast({ title: "Email, track, and a reason are required", variant: "destructive" })
      return
    }
    startTransition(async () => {
      const result = await createManualGrantAction({
        recipientEmail: grantEmail.trim(),
        trackId: grantTrackId,
        reason: grantReason.trim(),
      })
      if (result.success) {
        toast({ title: "Access granted" })
        setGrantEmail("")
        setGrantTrackId("")
        setGrantReason("")
      } else {
        toast({ title: "Grant failed", description: result.error, variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-6">
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">Commerce</h1>
      </HeaderContainer>

      {canManageEntitlements && (
        <Card>
          <CardHeader>
            <CardTitle>Grant independent access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-start">
            <Input
              placeholder="Recipient email"
              value={grantEmail}
              onChange={(event) => setGrantEmail(event.target.value)}
            />
            <Select value={grantTrackId} onValueChange={setGrantTrackId}>
              <SelectTrigger>
                <SelectValue placeholder="Track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((track) => (
                  <SelectItem key={track.id} value={track.id}>
                    {track.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Reason (required)"
              value={grantReason}
              onChange={(event) => setGrantReason(event.target.value)}
              className="min-h-[40px]"
            />
            <Button onClick={handleGrant} disabled={isPending}>
              Grant access
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Offering</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                {canManagePayments && <TableHead>Refund</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.userEmail}</TableCell>
                  <TableCell>{payment.offeringTitle}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[payment.status] ?? "outline"}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  {canManagePayments && (
                    <TableCell>
                      {payment.status === "SUCCEEDED" && !payment.hasRefund ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Reason"
                            className="h-8 w-40"
                            value={refundReasons[payment.id] ?? ""}
                            onChange={(event) =>
                              setRefundReasons((previous) => ({ ...previous, [payment.id]: event.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending && refundingId === payment.id}
                            onClick={() => handleRefund(payment.id)}
                          >
                            Refund
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.action}</TableCell>
                  <TableCell>
                    {event.resourceType}
                    {event.resourceId ? ` (${event.resourceId.slice(0, 8)}…)` : ""}
                  </TableCell>
                  <TableCell>{event.actorEmail ?? "system"}</TableCell>
                  <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
