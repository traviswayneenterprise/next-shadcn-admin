import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeaderContainer } from "@/components/ui/header-container"
import { SimpleCreateDialog } from "./components/simple-create-dialog"
import { createTrackAction } from "./tracks/actions"
import { TracksView } from "./tracks/components/tracks-view"
import type { TrackRow } from "./tracks/components/columns"

export default async function ContentPage() {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.read")) redirect("/403")

  const tracks = await prisma.track.findMany({
    where: { archivedAt: null },
    orderBy: { title: "asc" },
    include: { _count: { select: { courses: true } } },
  })
  const pendingReviewCount = permissions.includes("content.publish")
    ? await prisma.lessonVersion.count({ where: { reviewStatus: "PENDING" } })
    : 0

  const rows: TrackRow[] = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    description: track.description,
    status: track.status,
    courseCount: track._count.courses,
    href: `/content/tracks/${track.id}`,
  }))

  return (
    <>
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">Tracks</h1>
        <div className="flex items-center gap-2">
          {permissions.includes("content.publish") && (
            <Link href="/content/review">
              <Button variant="outline">Review queue ({pendingReviewCount})</Button>
            </Link>
          )}
          {permissions.includes("content.edit") && (
            <SimpleCreateDialog
              triggerLabel="New track"
              title="New track"
              description="A track is a top-level subject (e.g. Software Development, Photography) - the unit learners enroll in."
              action={createTrackAction}
            />
          )}
        </div>
      </HeaderContainer>
      <div className="flex-1 overflow-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All tracks</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tracks yet. Create one to get started.</p>
            ) : (
              <TracksView tracks={rows} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
