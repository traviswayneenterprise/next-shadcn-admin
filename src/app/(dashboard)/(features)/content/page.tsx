import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeaderContainer } from "@/components/ui/header-container"
import { ContentTable } from "./components/content-table"
import type { LessonRow } from "./components/columns"

export default async function ContentPage() {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.read")) redirect("/403")

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ module: { course: { track: { title: "asc" } } } }, { order: "asc" }],
    include: {
      module: { include: { course: { include: { track: true } } } },
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
    take: 200,
  })
  const pendingReviewCount = permissions.includes("content.publish")
    ? await prisma.lessonVersion.count({ where: { reviewStatus: "PENDING" } })
    : 0

  const rows: LessonRow[] = lessons.map((lesson) => {
    const latest = lesson.versions[0]
    return {
      id: lesson.id,
      title: lesson.title,
      trackTitle: lesson.module.course.track.title,
      courseTitle: lesson.module.course.title,
      moduleTitle: lesson.module.title,
      latestVersionId: latest?.id ?? null,
      latestStatus: latest?.status ?? null,
      latestReviewStatus: latest?.reviewStatus ?? null,
    }
  })

  return (
    <>
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        {permissions.includes("content.publish") && (
          <Link href="/content/review">
            <Button variant="outline">Review queue ({pendingReviewCount})</Button>
          </Link>
        )}
      </HeaderContainer>
      <div className="flex-1 overflow-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No lessons yet. The curriculum importer (Wednesday) populates these from source folders.
              </p>
            ) : (
              <ContentTable lessons={rows} canEdit={permissions.includes("content.edit")} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
