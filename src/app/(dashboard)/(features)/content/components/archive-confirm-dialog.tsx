"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/hooks/use-toast"

/** Confirms an archive (soft-delete) action for Track/Course/Module/Lesson - reversible in the database (archivedAt), just hidden from the active admin lists. */
export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  itemLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemLabel: string
  onConfirm: () => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onConfirm()
        onOpenChange(false)
        router.refresh()
      } catch {
        toast({ title: "Couldn't archive", description: "Try again.", variant: "destructive" })
      }
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Archive "${itemLabel}"?`}
      desc="It will be hidden from the active list. Nothing is permanently deleted - this can only be undone directly in the database for now."
      destructive
      confirmText="Archive"
      isLoading={isPending}
      handleConfirm={handleConfirm}
    />
  )
}
