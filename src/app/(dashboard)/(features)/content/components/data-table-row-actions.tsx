"use client"

import Link from "next/link"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import type { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { LessonRow } from "./columns"

export function DataTableRowActions({
  row,
  canEdit,
  onNewDraft,
}: {
  row: Row<LessonRow>
  canEdit: boolean
  onNewDraft: (lesson: LessonRow) => void
}) {
  const lesson = row.original
  const versionId = lesson.latestVersionId

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" />}
      >
        <DotsHorizontalIcon className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px]">
        {versionId ? (
          <>
            <DropdownMenuItem render={<Link href={`/content/lesson-versions/${versionId}`} />}>
              Continue in Classic
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/content/lesson-versions/${versionId}/editor-x`} />}>
              Continue in Editor X
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/content/lesson-versions/${versionId}/editor-tiptap`} />}>
              Continue in Tiptap
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>No draft yet</DropdownMenuItem>
        )}
        {canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNewDraft(lesson)}>New draft...</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
