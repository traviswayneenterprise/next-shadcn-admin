"use client"

import Link from "next/link"
import type { Route } from "next"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Edit/Archive row actions, shared across the catalog levels. `href` is
 * optional and adds an "Open" item - Tracks still have their own detail
 * page, but Courses/Modules live entirely inline in the Track workspace
 * accordion now, so they only get Edit/Archive.
 */
export function CatalogRowActions({
  href,
  onEdit,
  onArchive,
}: {
  href?: string
  onEdit: () => void
  onArchive: () => void
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" />}
      >
        <DotsHorizontalIcon className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {href && <DropdownMenuItem render={<Link href={href as Route} />}>Open</DropdownMenuItem>}
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onArchive}>
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
