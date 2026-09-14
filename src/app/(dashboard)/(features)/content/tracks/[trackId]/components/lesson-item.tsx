"use client"

import Link from "next/link"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type LessonRow = {
  id: string
  title: string
  estimatedMinutes: number | null
  latestVersionId: string | null
  latestStatus: string | null
  latestReviewStatus: string | null
}

export function LessonItem({
  lesson,
  canEdit,
  onNewDraft,
  onEdit,
  onArchive,
}: {
  lesson: LessonRow
  canEdit: boolean
  onNewDraft: (lesson: LessonRow) => void
  onEdit: (lesson: LessonRow) => void
  onArchive: (lesson: LessonRow) => void
}) {
  const versionId = lesson.latestVersionId

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-border hover:bg-muted/50">
      <span className="flex items-center gap-2 text-sm">
        {lesson.title}
        {lesson.latestStatus && <Badge variant="outline">{lesson.latestStatus}</Badge>}
        {lesson.latestReviewStatus && <Badge variant="secondary">{lesson.latestReviewStatus}</Badge>}
      </span>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="flex h-7 w-7 p-0 data-[state=open]:bg-muted" />}
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
              <DropdownMenuItem onClick={() => onEdit(lesson)}>Edit lesson</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onArchive(lesson)}>
                Archive
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
