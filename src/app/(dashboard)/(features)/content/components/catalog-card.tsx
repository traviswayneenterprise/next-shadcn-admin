"use client"

import Link from "next/link"
import type { Route } from "next"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CatalogRowActions } from "./catalog-row-actions"

/**
 * A single card tile for Track/Course/Module grids - "browse a category"
 * screens. Shared so all three levels look and behave the same; only the
 * Module level's own page (the leaf, where scale actually matters - 48+
 * lessons) uses a real table instead of cards.
 */
export function CatalogCard({
  icon: Icon,
  title,
  description,
  status,
  countLabel,
  href,
  onEdit,
  onArchive,
}: {
  icon: LucideIcon
  title: string
  description: string | null
  status: string
  countLabel: string
  href: string
  onEdit: () => void
  onArchive: () => void
}) {
  return (
    <li className="rounded-lg border p-4 hover:shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted p-2">
          <Icon className="size-full" />
        </div>
        <CatalogRowActions href={href} onEdit={onEdit} onArchive={onArchive} />
      </div>
      <Link href={href as Route} className="block">
        <h2 className="mb-1 font-semibold hover:underline">{title}</h2>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{description || "No description yet."}</p>
      </Link>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{status}</Badge>
        <span className="text-xs text-muted-foreground">{countLabel}</span>
      </div>
    </li>
  )
}
